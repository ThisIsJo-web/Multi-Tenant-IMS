import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permtypes.definitions.js';

export const PERMISSIONS_KEY = 'permtypes:permissions';

/**
 * Decorator to require one or more PermissionCodes on a controller or route handler.
 * Evaluated at runtime by PermTypesGuard.
 */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
