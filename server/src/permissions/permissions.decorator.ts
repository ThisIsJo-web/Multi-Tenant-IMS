import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permissions.types.js';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Decorator to enforce one or more permissions on a controller route.
 * @param permissions Required permission code(s)
 */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
