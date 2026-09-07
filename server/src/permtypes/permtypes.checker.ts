import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  PermissionCode,
  MANAGER_DEFAULT_PERMISSIONS,
  SUPERADMIN_PERMISSIONS,
  USER_DEFAULT_PERMISSIONS,
} from './permtypes.definitions.js';

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  canCreateEnterprise?: boolean;
}

export interface EnterpriseMemberContext {
  id?: string;
  enterpriseId: string;
  userId: string;
  role: string;
  permissions: string[];
}

export interface PermissionEvaluationResult {
  allowed: boolean;
  missingPermissions: PermissionCode[];
  effectivePermissions: string[];
  reason?: string;
}

export class PermissionChecker {
  /**
   * Evaluates the authorization chain:
   * User -> Enterprise Membership -> Assigned Role -> Role Permissions -> Permission Check
   */
  static evaluate(
    user: UserContext | null | undefined,
    membership: EnterpriseMemberContext | null | undefined,
    requiredPermissions: PermissionCode[],
  ): PermissionEvaluationResult {
    if (!user) {
      return {
        allowed: false,
        missingPermissions: requiredPermissions,
        effectivePermissions: [],
        reason: 'User not authenticated',
      };
    }

    // If no permissions required, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return {
        allowed: true,
        missingPermissions: [],
        effectivePermissions: [],
      };
    }

    // 1. SuperAdmin Role: God-mode bypass (all permissions granted)
    if (user.role === 'superadmin') {
      return {
        allowed: true,
        missingPermissions: [],
        effectivePermissions: [...SUPERADMIN_PERMISSIONS],
        reason: 'SuperAdmin bypass',
      };
    }

    // 2. Global Platform-level permission check for enterprise creation
    const isOnlyEnterpriseCreate =
      requiredPermissions.length === 1 && requiredPermissions[0] === 'enterprise:create';
    if (isOnlyEnterpriseCreate && (user.role === 'manager' || user.canCreateEnterprise)) {
      return {
        allowed: true,
        missingPermissions: [],
        effectivePermissions: ['enterprise:create'],
        reason: 'Authorized to create enterprise via role or platform flag',
      };
    }

    // 3. Enterprise Membership Resolution
    let effectivePermissions: string[] = [];

    if (membership) {
      if (membership.role === 'manager') {
        // Manager role inside enterprise inherits all manager-level permissions
        effectivePermissions = [...MANAGER_DEFAULT_PERMISSIONS];
      } else {
        // Regular staff role inherits only explicitly assigned member permissions
        effectivePermissions = membership.permissions || [...USER_DEFAULT_PERMISSIONS];
      }
    } else {
      // Not a member of this enterprise -> strictly zero permissions
      effectivePermissions = [...USER_DEFAULT_PERMISSIONS];
    }

    // 4. Permission Check against Required Permissions
    const permSet = new Set(effectivePermissions);
    const missingPermissions = requiredPermissions.filter((p) => !permSet.has(p));

    return {
      allowed: missingPermissions.length === 0,
      missingPermissions,
      effectivePermissions,
      reason:
        missingPermissions.length === 0
          ? 'Authorized'
          : `Missing permissions: ${missingPermissions.join(', ')}`,
    };
  }

  /**
   * Asserts permission compliance; throws 401 if unauthenticated, 403 if unauthorized.
   */
  static assert(
    user: UserContext | null | undefined,
    membership: EnterpriseMemberContext | null | undefined,
    requiredPermissions: PermissionCode[],
  ): void {
    if (!user) {
      throw new UnauthorizedException('Authentication required to verify permissions');
    }

    const result = this.evaluate(user, membership, requiredPermissions);

    if (!result.allowed) {
      throw new ForbiddenException(
        `Insufficient permissions. Missing: ${result.missingPermissions.join(', ')}`,
      );
    }
  }
}
