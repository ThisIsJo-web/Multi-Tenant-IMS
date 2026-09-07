import { Injectable } from '@nestjs/common';
import {
  PermissionCode,
  PermissionDefinition,
  SYSTEM_PERMISSIONS,
  SUPERADMIN_PERMISSIONS,
  MANAGER_DEFAULT_PERMISSIONS,
  USER_DEFAULT_PERMISSIONS,
} from './permissions.types.js';

@Injectable()
export class PermissionsService {
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
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return [...SUPERADMIN_PERMISSIONS];
      case 'manager':
        return [...MANAGER_DEFAULT_PERMISSIONS];
      case 'user':
      case 'staff':
      default:
        return [...USER_DEFAULT_PERMISSIONS];
    }
  }

  /**
   * Verify if a user's permission array satisfies all required permissions.
   * If user is superadmin or has 'system:admin', always returns true.
   */
  hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: PermissionCode[],
    isSuperAdmin = false,
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
    isSuperAdmin = false,
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
   * Filter and validate an array of permission strings against known system codes.
   */
  sanitizePermissions(permissions: string[]): PermissionCode[] {
    if (!Array.isArray(permissions)) return [];
    const validCodes = new Set(SYSTEM_PERMISSIONS.map((p) => p.code));
    return permissions.filter((p): p is PermissionCode => validCodes.has(p));
  }
}
