import { describe, it, expect } from 'vitest';
import { PermissionChecker } from './permtypes.checker.js';
import {
  SUPERADMIN_PERMISSIONS,
  MANAGER_DEFAULT_PERMISSIONS,
  PermissionCode,
} from './permtypes.definitions.js';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('PermTypes Engine - PermissionChecker', () => {
  const superadminUser = { id: 'sa-1', role: 'superadmin', canCreateEnterprise: true };
  const managerUser = { id: 'mgr-1', role: 'manager', canCreateEnterprise: true };
  const regularUser = { id: 'usr-1', role: 'user', canCreateEnterprise: false };

  const enterpriseId = 'ent-test-123';

  const managerMembership = {
    enterpriseId,
    userId: managerUser.id,
    role: 'manager',
    permissions: [],
  };

  const zeroPermStaffMembership = {
    enterpriseId,
    userId: regularUser.id,
    role: 'staff',
    permissions: [],
  };

  const scopedStaffMembership = {
    enterpriseId,
    userId: regularUser.id,
    role: 'staff',
    permissions: ['stock:view', 'stock:receive'],
  };

  describe('1. SuperAdmin Role (God-Mode Bypass)', () => {
    it('should grant all 12 system permissions to SuperAdmin unconditionally', () => {
      const result = PermissionChecker.evaluate(superadminUser, null, [
        'stock:view',
        'stock:adjust',
        'reports:export',
        'system:manage',
      ]);
      expect(result.allowed).toBe(true);
      expect(result.missingPermissions).toHaveLength(0);
      expect(result.effectivePermissions).toHaveLength(SUPERADMIN_PERMISSIONS.length);
    });

    it('should allow SuperAdmin even with no enterprise membership', () => {
      expect(() =>
        PermissionChecker.assert(superadminUser, null, ['system:manage', 'enterprise:manage']),
      ).not.toThrow();
    });
  });

  describe('2. Manager Role Hierarchy', () => {
    it('should inherit all manager default permissions inside their enterprise', () => {
      const result = PermissionChecker.evaluate(managerUser, managerMembership, [
        'enterprise:manage',
        'permissions:grant',
        'users:manage',
        'stock:view',
        'stock:receive',
        'stock:audit',
        'reports:view',
      ]);
      expect(result.allowed).toBe(true);
      expect(result.missingPermissions).toHaveLength(0);
    });

    it('should deny system:manage for Manager role', () => {
      const result = PermissionChecker.evaluate(managerUser, managerMembership, ['system:manage']);
      expect(result.allowed).toBe(false);
      expect(result.missingPermissions).toContain('system:manage');
    });
  });

  describe('3. Regular User with Zero Default Permissions', () => {
    it('should deny actions for staff with empty permissions []', () => {
      const result = PermissionChecker.evaluate(regularUser, zeroPermStaffMembership, [
        'stock:view',
      ]);
      expect(result.allowed).toBe(false);
      expect(result.missingPermissions).toEqual(['stock:view']);
      expect(result.effectivePermissions).toEqual([]);
    });

    it('should throw 403 ForbiddenException when assert fails on missing permissions', () => {
      expect(() =>
        PermissionChecker.assert(regularUser, zeroPermStaffMembership, ['stock:view']),
      ).toThrow(ForbiddenException);

      try {
        PermissionChecker.assert(regularUser, zeroPermStaffMembership, ['stock:view', 'stock:receive']);
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.message).toContain('Insufficient permissions. Missing: stock:view, stock:receive');
      }
    });
  });

  describe('4. Dynamic Scoped Permissions for Staff', () => {
    it('should allow actions matching granted permissions', () => {
      const result = PermissionChecker.evaluate(regularUser, scopedStaffMembership, [
        'stock:view',
        'stock:receive',
      ]);
      expect(result.allowed).toBe(true);
      expect(result.missingPermissions).toHaveLength(0);
    });

    it('should deny actions for unassigned permissions (e.g. stock:adjust)', () => {
      const result = PermissionChecker.evaluate(regularUser, scopedStaffMembership, [
        'stock:view',
        'stock:adjust',
      ]);
      expect(result.allowed).toBe(false);
      expect(result.missingPermissions).toEqual(['stock:adjust']);
    });
  });

  describe('5. Platform-level Enterprise Creation', () => {
    it('should allow enterprise:create if user has canCreateEnterprise', () => {
      const authorizedUser = { id: 'u-2', role: 'user', canCreateEnterprise: true };
      const result = PermissionChecker.evaluate(authorizedUser, null, ['enterprise:create']);
      expect(result.allowed).toBe(true);
    });

    it('should allow enterprise:create if user has role manager', () => {
      const result = PermissionChecker.evaluate(managerUser, null, ['enterprise:create']);
      expect(result.allowed).toBe(true);
    });

    it('should deny enterprise:create for standard user without flag', () => {
      const result = PermissionChecker.evaluate(regularUser, null, ['enterprise:create']);
      expect(result.allowed).toBe(false);
      expect(result.missingPermissions).toEqual(['enterprise:create']);
    });
  });

  describe('6. Unauthenticated Access', () => {
    it('should throw 401 UnauthorizedException when user is null', () => {
      expect(() => PermissionChecker.assert(null, null, ['stock:view'])).toThrow(
        UnauthorizedException,
      );
    });
  });
});
