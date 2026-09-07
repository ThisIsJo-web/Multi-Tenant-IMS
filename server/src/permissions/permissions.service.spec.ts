import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionsService } from './permissions.service.js';
import { SYSTEM_PERMISSIONS } from './permissions.types.js';

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(() => {
    service = new PermissionsService();
  });

  it('should return all defined system permissions', () => {
    const list = service.getAllPermissions();
    expect(list.length).toBe(SYSTEM_PERMISSIONS.length);
    expect(list.some((p) => p.code === 'enterprise:manage')).toBe(true);
    expect(list.some((p) => p.code === 'permissions:grant')).toBe(true);
    expect(list.some((p) => p.code === 'stock:view')).toBe(true);
  });

  it('should grant all permissions to superadmin role', () => {
    const perms = service.getDefaultPermissionsByRole('superadmin');
    expect(perms.length).toBe(SYSTEM_PERMISSIONS.length);
    expect(perms).toContain('system:admin');
    expect(perms).toContain('enterprise:manage');
  });

  it('should return manager default permissions', () => {
    const perms = service.getDefaultPermissionsByRole('manager');
    expect(perms).toContain('enterprise:create');
    expect(perms).toContain('enterprise:manage');
    expect(perms).toContain('permissions:grant');
    expect(perms).toContain('stock:view');
    expect(perms).not.toContain('system:admin');
  });

  it('should return empty array for regular user/staff by default', () => {
    const perms = service.getDefaultPermissionsByRole('user');
    expect(perms).toEqual([]);

    const staffPerms = service.getDefaultPermissionsByRole('staff');
    expect(staffPerms).toEqual([]);
  });

  it('should accurately verify hasAllPermissions with SuperAdmin bypass', () => {
    // Regular check
    expect(service.hasAllPermissions(['stock:view'], ['stock:view'])).toBe(true);
    expect(service.hasAllPermissions(['stock:view'], ['stock:view', 'stock:receive'])).toBe(false);

    // SuperAdmin bypass
    expect(service.hasAllPermissions([], ['stock:view', 'stock:transfer'], true)).toBe(true);
  });

  it('should sanitize and strip invalid permission codes', () => {
    const sanitized = service.sanitizePermissions(['stock:view', 'invalid:code', 'enterprise:manage']);
    expect(sanitized).toEqual(['stock:view', 'enterprise:manage']);
  });
});
