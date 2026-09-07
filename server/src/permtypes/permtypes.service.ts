import { Injectable } from '@nestjs/common';
import {
  PermissionCategory,
  PermissionCode,
  PermissionDefinition,
  SYSTEM_PERMISSIONS,
  SUPERADMIN_PERMISSIONS,
  MANAGER_DEFAULT_PERMISSIONS,
  USER_DEFAULT_PERMISSIONS,
} from './permtypes.definitions.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PermissionChecker } from './permtypes.checker.js';

@Injectable()
export class PermTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return all system permissions with category and descriptive metadata
   */
  getAllPermissions(): PermissionDefinition[] {
    return SYSTEM_PERMISSIONS;
  }

  /**
   * Return default permission codes by user/enterprise role
   */
  getDefaultPermissionsByRole(role: string): PermissionCode[] {
    switch (role) {
      case 'superadmin':
        return [...SUPERADMIN_PERMISSIONS];
      case 'manager':
        return [...MANAGER_DEFAULT_PERMISSIONS];
      case 'staff':
      case 'user':
      default:
        return [...USER_DEFAULT_PERMISSIONS];
    }
  }

  /**
   * Verify if a user's permission array satisfies all required permissions.
   */
  hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: PermissionCode[],
    isSuperAdmin: boolean = false,
  ): boolean {
    if (isSuperAdmin || userPermissions.includes('system:admin')) {
      return true;
    }
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const userSet = new Set(userPermissions);
    return requiredPermissions.every((p) => userSet.has(p));
  }

  /**
   * Verify if a user's permission array satisfies at least one required permission.
   */
  hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: PermissionCode[],
    isSuperAdmin: boolean = false,
  ): boolean {
    if (isSuperAdmin || userPermissions.includes('system:admin')) {
      return true;
    }
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const userSet = new Set(userPermissions);
    return requiredPermissions.some((p) => userSet.has(p));
  }

  /**
   * Sanitize an incoming list of permission strings to only known, valid PermissionCodes
   */
  sanitizePermissions(permissions: string[]): PermissionCode[] {
    if (!permissions || !Array.isArray(permissions)) {
      return [];
    }
    const validCodes = new Set(SYSTEM_PERMISSIONS.map((p) => p.code));
    return permissions.filter((p): p is PermissionCode => validCodes.has(p as PermissionCode));
  }

  /**
   * Calculate effective permissions for a user in a given enterprise context.
   */
  async getUserEffectivePermissions(
    userId: string,
    enterpriseId?: string,
  ): Promise<{
    userRole: string;
    enterpriseRole?: string;
    effectivePermissions: string[];
    isSuperAdmin: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        userRole: 'guest',
        effectivePermissions: [],
        isSuperAdmin: false,
      };
    }

    if (user.role === 'superadmin') {
      return {
        userRole: 'superadmin',
        effectivePermissions: [...SUPERADMIN_PERMISSIONS],
        isSuperAdmin: true,
      };
    }

    let enterpriseRole: string | undefined;
    let membership = null;

    if (enterpriseId) {
      membership = await this.prisma.enterpriseMember.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId,
            userId,
          },
        },
      });
      if (membership) {
        enterpriseRole = membership.role;
      }
    }

    const role = user.role || 'user';

    const evalResult = PermissionChecker.evaluate(
      {
        id: user.id,
        role,
        canCreateEnterprise: user.canCreateEnterprise,
      },
      membership,
      [],
    );

    return {
      userRole: role,
      enterpriseRole,
      effectivePermissions: evalResult.effectivePermissions,
      isSuperAdmin: false,
    };
  }
}
