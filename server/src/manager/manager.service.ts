import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddStaffDto } from './dto/add-staff.dto.js';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure caller is manager of the specified enterprise or superadmin
   */
  private async ensureManagerAccess(userId: string, enterpriseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'superadmin') return true;

    const membership = await this.prisma.enterpriseMember.findUnique({
      where: {
        enterpriseId_userId: {
          enterpriseId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== 'manager') {
      throw new ForbiddenException('Only an Enterprise Manager or SuperAdmin can manage staff members');
    }

    return true;
  }

  /**
   * List all staff inside the specific enterprise
   */
  async getEnterpriseStaff(managerId: string, enterpriseId: string) {
    await this.ensureManagerAccess(managerId, enterpriseId);

    const members = await this.prisma.enterpriseMember.findMany({
      where: { enterpriseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      systemRole: m.user.role,
      role: m.role,
      permissions: m.permissions,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Add a staff member to the enterprise by user email
   */
  async addStaffMember(managerId: string, enterpriseId: string, dto: AddStaffDto) {
    await this.ensureManagerAccess(managerId, enterpriseId);

    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Staff email is required');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `User with email "${cleanEmail}" does not have an account on Koll. Ask them to register first.`,
      );
    }

    const existingMember = await this.prisma.enterpriseMember.findUnique({
      where: {
        enterpriseId_userId: {
          enterpriseId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(`User "${cleanEmail}" is already a member of this Enterprise.`);
    }

    const newMember = await this.prisma.enterpriseMember.create({
      data: {
        enterpriseId,
        userId: targetUser.id,
        role: dto.role || 'staff',
        permissions: dto.permissions?.length ? dto.permissions : ['stock:view'],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Added staff member ${cleanEmail} to enterprise ${enterpriseId} by manager ${managerId}`);

    return {
      message: `Staff member ${cleanEmail} successfully added to enterprise.`,
      member: {
        id: newMember.id,
        userId: newMember.user.id,
        name: newMember.user.name,
        email: newMember.user.email,
        role: newMember.role,
        permissions: newMember.permissions,
        joinedAt: newMember.createdAt,
      },
    };
  }

  /**
   * List all pending join requests for an enterprise
   */
  async getPendingJoinRequests(managerId: string, enterpriseId: string) {
    await this.ensureManagerAccess(managerId, enterpriseId);

    const requests = await this.prisma.enterpriseJoinRequest.findMany({
      where: {
        enterpriseId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r: any) => ({
      id: r.id,
      userId: r.user.id,
      name: r.user.name,
      email: r.user.email,
      status: r.status,
      permissions: r.permissions,
      requestedAt: r.createdAt,
    }));
  }

  /**
   * Approve a pending join request and assign custom permissions
   */
  async approveJoinRequest(
    managerId: string,
    requestId: string,
    permissions?: string[],
  ) {
    const request = await this.prisma.enterpriseJoinRequest.findUnique({
      where: { id: requestId },
      include: { enterprise: true, user: true },
    });

    if (!request) {
      throw new NotFoundException(`Join request ${requestId} not found`);
    }

    await this.ensureManagerAccess(managerId, request.enterpriseId);

    if (request.status !== 'pending') {
      throw new BadRequestException(`Join request is already ${request.status}`);
    }

    const assignedPermissions =
      permissions && permissions.length > 0 ? permissions : ['stock:view'];

    // Update request record
    await this.prisma.enterpriseJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        permissions: assignedPermissions,
        reviewedAt: new Date(),
        reviewerId: managerId,
      },
    });

    // Create or update enterprise membership
    const member = await this.prisma.enterpriseMember.upsert({
      where: {
        enterpriseId_userId: {
          enterpriseId: request.enterpriseId,
          userId: request.userId,
        },
      },
      create: {
        enterpriseId: request.enterpriseId,
        userId: request.userId,
        role: 'staff',
        permissions: assignedPermissions,
      },
      update: {
        permissions: assignedPermissions,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Manager ${managerId} approved join request ${requestId} for user ${request.user.email} with permissions: ${assignedPermissions.join(', ')}`,
    );

    return {
      message: `Approved join request for ${request.user.name} (${request.user.email}).`,
      member: {
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.createdAt,
      },
    };
  }

  /**
   * Reject a pending join request
   */
  async rejectJoinRequest(managerId: string, requestId: string) {
    const request = await this.prisma.enterpriseJoinRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException(`Join request ${requestId} not found`);
    }

    await this.ensureManagerAccess(managerId, request.enterpriseId);

    if (request.status !== 'pending') {
      throw new BadRequestException(`Join request is already ${request.status}`);
    }

    await this.prisma.enterpriseJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewerId: managerId,
      },
    });

    this.logger.log(`Manager ${managerId} rejected join request ${requestId} for user ${request.user.email}`);

    return {
      message: `Rejected join request for ${request.user.name} (${request.user.email}).`,
    };
  }

  /**
   * Edit permissions for an existing staff member
   */
  async updateStaffPermissions(
    managerId: string,
    enterpriseId: string,
    memberId: string,
    permissions: string[],
  ) {
    await this.ensureManagerAccess(managerId, enterpriseId);

    const member = await this.prisma.enterpriseMember.findFirst({
      where: {
        id: memberId,
        enterpriseId,
      },
    });

    if (!member) {
      throw new NotFoundException(`Staff member not found in enterprise`);
    }

    const updated = await this.prisma.enterpriseMember.update({
      where: { id: memberId },
      data: {
        permissions: permissions && permissions.length > 0 ? permissions : ['stock:view'],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Manager ${managerId} updated permissions for staff member ${updated.user.email} to: ${updated.permissions.join(', ')}`,
    );

    return {
      message: `Permissions updated for ${updated.user.name}.`,
      member: {
        id: updated.id,
        userId: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
        permissions: updated.permissions,
        joinedAt: updated.createdAt,
      },
    };
  }

  /**
   * Remove a staff member from the enterprise
   */
  async removeStaffMember(
    managerId: string,
    enterpriseId: string,
    memberId: string,
  ) {
    await this.ensureManagerAccess(managerId, enterpriseId);

    const member = await this.prisma.enterpriseMember.findFirst({
      where: {
        id: memberId,
        enterpriseId,
      },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException(`Staff member not found in enterprise`);
    }

    await this.prisma.enterpriseMember.delete({
      where: { id: memberId },
    });

    this.logger.log(
      `Manager ${managerId} removed staff member ${member.user.email} from enterprise ${enterpriseId}`,
    );

    return {
      message: `Staff member ${member.user.name} (${member.user.email}) removed from enterprise.`,
    };
  }
}
