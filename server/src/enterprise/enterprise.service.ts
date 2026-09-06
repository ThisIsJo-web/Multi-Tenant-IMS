import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateEnterpriseKey, isValidEnterpriseKeyFormat } from './utils/enterprise-key.util.js';
import { auth } from '../auth/auth.js';
import { CreateEnterpriseDto, KeyLoginDto, SwitchEnterpriseDto } from './dto/index.js';

export const MANAGER_DEFAULT_PERMISSIONS = [
  'stock:view',
  'stock:receive',
  'stock:transfer',
  'stock:adjust',
  'stock:audit',
  'enterprise:manage',
];

export const STAFF_DEFAULT_PERMISSIONS = ['stock:view'];

@Injectable()
export class EnterpriseService {
  private readonly logger = new Logger(EnterpriseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to slugify enterprise names
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate a unique enterprise key with collision protection
   */
  private async generateUniqueEnterpriseKey(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const key = generateEnterpriseKey();
      const existing = await this.prisma.enterprise.findUnique({
        where: { enterpriseKey: key },
        select: { id: true },
      });
      if (!existing) {
        return key;
      }
      attempts++;
    }
    throw new ConflictException('Failed to generate a unique Enterprise Key. Please retry.');
  }

  /**
   * Register a new Enterprise. Only allowed for users with role 'manager' or 'superadmin'.
   */
  async createEnterprise(userId: string, dto: CreateEnterpriseDto, sessionId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, canCreateEnterprise: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isManager = user.role === 'manager';
    const isSuperAdmin = user.role === 'superadmin';

    if (!isManager && !isSuperAdmin) {
      this.logger.warn(`User ${userId} attempted to create enterprise without manager/superadmin role.`);
      throw new ForbiddenException(
        'Only users with the Manager role can create an Enterprise. Complete the Manager Acknowledgment to get started.',
      );
    }

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Enterprise name is required');
    }

    const baseSlug = dto.slug?.trim() || this.slugify(dto.name);
    let finalSlug = baseSlug;
    let slugCounter = 1;

    while (await this.prisma.enterprise.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${slugCounter++}`;
    }

    const enterpriseKey = await this.generateUniqueEnterpriseKey();

    const result = await this.prisma.$transaction(async (tx) => {
      const enterprise = await tx.enterprise.create({
        data: {
          name: dto.name.trim(),
          slug: finalSlug,
          logo: dto.logo || null,
          metadata: dto.metadata || null,
          enterpriseKey,
        },
      });

      const member = await tx.enterpriseMember.create({
        data: {
          enterpriseId: enterprise.id,
          userId: user.id,
          role: 'manager',
          permissions: MANAGER_DEFAULT_PERMISSIONS,
        },
      });

      if (sessionId) {
        await tx.session.update({
          where: { id: sessionId },
          data: { activeEnterpriseId: enterprise.id },
        });
      }

      return { enterprise, member };
    });

    this.logger.log(
      `Enterprise created: "${result.enterprise.name}" (${result.enterprise.id}) with Key: ${enterpriseKey} by user ${userId}`,
    );

    return result;
  }

  /**
   * Regenerate/Rotate Enterprise Key by Enterprise Manager or SuperAdmin
   */
  async rotateEnterpriseKey(userId: string, enterpriseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isSuperAdmin = user.role === 'superadmin';

    if (!isSuperAdmin) {
      const membership = await this.prisma.enterpriseMember.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId,
            userId,
          },
        },
      });

      if (!membership || membership.role !== 'manager') {
        throw new ForbiddenException('Only an Enterprise Manager or SuperAdmin can regenerate the Enterprise Key');
      }
    }

    const newKey = await this.generateUniqueEnterpriseKey();

    const updated = await this.prisma.enterprise.update({
      where: { id: enterpriseId },
      data: { enterpriseKey: newKey },
      select: {
        id: true,
        name: true,
        slug: true,
        enterpriseKey: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Enterprise key rotated for ${updated.name} (${updated.id}) by user ${userId}. New Key: ${newKey}`);

    return {
      message: 'Enterprise Key successfully regenerated',
      enterprise: updated,
    };
  }

  /**
   * Switch active tenant context via Enterprise Key or Enterprise ID
   */
  async switchEnterprise(userId: string, sessionId: string, options: SwitchEnterpriseDto) {
    let enterprise;

    if (options.enterpriseKey) {
      const cleanedKey = options.enterpriseKey.trim().toUpperCase();
      enterprise = await this.prisma.enterprise.findUnique({
        where: { enterpriseKey: cleanedKey },
      });
      if (!enterprise) {
        throw new NotFoundException(`No enterprise found matching key "${cleanedKey}"`);
      }
    } else if (options.enterpriseId) {
      enterprise = await this.prisma.enterprise.findUnique({
        where: { id: options.enterpriseId },
      });
      if (!enterprise) {
        throw new NotFoundException(`No enterprise found with ID "${options.enterpriseId}"`);
      }
    } else {
      throw new BadRequestException('Either enterpriseKey or enterpriseId must be provided');
    }

    // Validate user holds an active membership
    const membership = await this.prisma.enterpriseMember.findUnique({
      where: {
        enterpriseId_userId: {
          enterpriseId: enterprise.id,
          userId,
        },
      },
    });

    if (!membership) {
      if (options.enterpriseKey) {
        // Check for existing pending join request
        const existingRequest = await this.prisma.enterpriseJoinRequest.findFirst({
          where: {
            enterpriseId: enterprise.id,
            userId,
            status: 'pending',
          },
        });

        if (existingRequest) {
          return {
            status: 'pending',
            message: `Your request to join Enterprise "${enterprise.name}" is pending manager approval.`,
            enterprise: {
              id: enterprise.id,
              name: enterprise.name,
              slug: enterprise.slug,
            },
            request: existingRequest,
          };
        }

        // Create new join request
        const newRequest = await this.prisma.enterpriseJoinRequest.create({
          data: {
            enterpriseId: enterprise.id,
            userId,
            status: 'pending',
            permissions: ['stock:view'],
          },
        });

        this.logger.log(`User ${userId} created join request for Enterprise "${enterprise.name}" (${enterprise.id})`);

        return {
          status: 'request_created',
          message: `Request to join Enterprise "${enterprise.name}" submitted! Awaiting manager review and permission assignment.`,
          enterprise: {
            id: enterprise.id,
            name: enterprise.name,
            slug: enterprise.slug,
          },
          request: newRequest,
        };
      }

      throw new ForbiddenException(
        `You do not hold an active membership in Enterprise "${enterprise.name}".`,
      );
    }

    // Set activeEnterpriseId on session
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { activeEnterpriseId: enterprise.id },
    });

    this.logger.log(`User ${userId} switched active enterprise to "${enterprise.name}" (${enterprise.id})`);

    return {
      status: 'active',
      message: `Switched active workspace to "${enterprise.name}"`,
      activeEnterpriseId: enterprise.id,
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        logo: enterprise.logo,
        enterpriseKey: membership.role === 'manager' ? enterprise.enterpriseKey : undefined,
      },
      membership: {
        role: membership.role,
        permissions: membership.permissions,
      },
    };
  }

  /**
   * Get list of join requests submitted by current user
   */
  async getUserJoinRequests(userId: string) {
    const requests = await this.prisma.enterpriseJoinRequest.findMany({
      where: { userId },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r: any) => ({
      id: r.id,
      enterpriseId: r.enterpriseId,
      enterpriseName: r.enterprise.name,
      enterpriseSlug: r.enterprise.slug,
      status: r.status,
      permissions: r.permissions,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
    }));
  }

  /**
   * Authenticate with user credentials AND Enterprise Key.
   * Validates key exists, credentials match, user holds active membership, and sets activeEnterpriseId on session.
   */
  async loginWithEnterpriseKey(dto: KeyLoginDto) {
    if (!dto.enterpriseKey || !dto.email || !dto.password) {
      throw new BadRequestException('Email, password, and enterpriseKey are required');
    }

    const cleanedKey = dto.enterpriseKey.trim().toUpperCase();
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { enterpriseKey: cleanedKey },
    });

    if (!enterprise) {
      throw new BadRequestException('Invalid Enterprise Key or Enterprise does not exist');
    }

    // Authenticate credentials via Better-Auth
    let authResponse;
    try {
      authResponse = await auth.api.signInEmail({
        body: {
          email: dto.email.trim().toLowerCase(),
          password: dto.password,
        },
        asResponse: true,
      });
    } catch (err: any) {
      this.logger.warn(`Enterprise key login failed for email ${dto.email}: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Invalid email or password');
    }

    if (!authResponse || !authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      throw new UnauthorizedException(errorData.message || 'Authentication failed');
    }

    const authData = await authResponse.json();
    const user = authData.user;
    const sessionToken = authData.token || authData.session?.token;

    if (!user) {
      throw new UnauthorizedException('Authentication failed: user record not found');
    }

    // Check if user is a member of this enterprise
    const membership = await this.prisma.enterpriseMember.findUnique({
      where: {
        enterpriseId_userId: {
          enterpriseId: enterprise.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        `User ${dto.email} is not a member of Enterprise "${enterprise.name}".`,
      );
    }

    // Update activeEnterpriseId on session
    if (sessionToken) {
      await this.prisma.session.updateMany({
        where: { token: sessionToken },
        data: { activeEnterpriseId: enterprise.id },
      });
    }

    return {
      user,
      session: {
        ...authData.session,
        activeEnterpriseId: enterprise.id,
      },
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        slug: enterprise.slug,
        enterpriseKey: membership.role === 'manager' || user.role === 'superadmin' ? enterprise.enterpriseKey : undefined,
      },
      membership: {
        role: membership.role,
        permissions: membership.permissions,
      },
      setCookie: authResponse.headers.get('set-cookie'),
    };
  }

  /**
   * Get user's current enterprise profile, list of enterprises, and permissions
   */
  async getCurrentContext(userId: string, activeEnterpriseId?: string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canCreateEnterprise: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Fetch all user's memberships
    const memberships = await this.prisma.enterpriseMember.findMany({
      where: { userId },
      include: {
        enterprise: true,
      },
    });

    let activeEnterprise = null;
    let activeMembership = null;

    if (activeEnterpriseId) {
      const match = memberships.find((m) => m.enterpriseId === activeEnterpriseId);
      if (match) {
        activeEnterprise = match.enterprise;
        activeMembership = match;
      }
    }

    // If no active enterprise is set, default to first membership
    if (!activeEnterprise && memberships.length > 0) {
      activeEnterprise = memberships[0].enterprise;
      activeMembership = memberships[0];
    }

    return {
      user,
      activeEnterprise: activeEnterprise
        ? {
            id: activeEnterprise.id,
            name: activeEnterprise.name,
            slug: activeEnterprise.slug,
            logo: activeEnterprise.logo,
            enterpriseKey:
              activeMembership?.role === 'manager' || user.role === 'superadmin'
                ? activeEnterprise.enterpriseKey
                : undefined,
          }
        : null,
      activeMembership: activeMembership
        ? {
            role: activeMembership.role,
            permissions: activeMembership.permissions,
          }
        : null,
      enterprises: memberships.map((m) => ({
        id: m.enterprise.id,
        name: m.enterprise.name,
        slug: m.enterprise.slug,
        role: m.role,
        permissions: m.permissions,
        enterpriseKey:
          m.role === 'manager' || user.role === 'superadmin'
            ? m.enterprise.enterpriseKey
            : undefined,
      })),
    };
  }

  /**
   * SuperAdmin: List all users on platform with permissions & enterprise stats
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canCreateEnterprise: true,
        banned: true,
        banReason: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            enterprise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return users;
  }

  /**
   * SuperAdmin: Toggle or set canCreateEnterprise on any user
   */
  async toggleCanCreateEnterprise(targetUserId: string, value?: boolean) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, canCreateEnterprise: true },
    });

    if (!target) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const nextValue = typeof value === 'boolean' ? value : !target.canCreateEnterprise;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { canCreateEnterprise: nextValue },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canCreateEnterprise: true,
      },
    });

    this.logger.log(`SuperAdmin updated canCreateEnterprise for ${updated.email} to ${nextValue}`);

    return {
      message: `canCreateEnterprise set to ${nextValue} for ${updated.email}`,
      user: updated,
    };
  }

  /**
   * SuperAdmin: List all enterprises on platform
   */
  async getAllEnterprises() {
    const enterprises = await this.prisma.enterprise.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        enterpriseKey: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            permissions: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return enterprises.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      enterpriseKey: e.enterpriseKey,
      createdAt: e.createdAt,
      memberCount: e.members.length,
      managers: e.members.filter((m) => m.role === 'manager').map((m) => m.user),
      members: e.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        permissions: m.permissions,
      })),
    }));
  }
}
