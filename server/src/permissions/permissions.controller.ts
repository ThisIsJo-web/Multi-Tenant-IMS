import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';

@Controller('api/permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Return the entire system permission catalog, grouped categories, and role presets.
   */
  @Get()
  getPermissionsCatalog() {
    const permissions = this.permissionsService.getAllPermissions();
    return {
      permissions,
      roles: {
        superadmin: this.permissionsService.getDefaultPermissionsByRole('superadmin'),
        manager: this.permissionsService.getDefaultPermissionsByRole('manager'),
        user: this.permissionsService.getDefaultPermissionsByRole('user'),
      },
      categories: [
        'Enterprise',
        'Access Control',
        'Inventory / Stock',
        'Reports & Analytics',
        'System',
      ],
    };
  }
}
