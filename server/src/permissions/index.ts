// Re-export all permission definitions, checker, guards, and services from permtypes
export * from '../permtypes/index.js';

// Backward compatibility aliases
export { PermTypesGuard as PermissionsGuard } from '../permtypes/permtypes.guard.js';
export { PermTypesService as PermissionsService } from '../permtypes/permtypes.service.js';
export { PermTypesModule as PermissionsModule } from '../permtypes/permtypes.module.js';
export { PermTypesController as PermissionsController } from '../permtypes/permtypes.controller.js';
