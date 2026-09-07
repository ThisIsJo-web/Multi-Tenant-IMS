import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PermTypesService } from './permtypes.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('api/permissions')
export class PermTypesController {
  constructor(private readonly permTypesService: PermTypesService) {}

  /**
   * Public: Return the global permissions catalog with role defaults
   */
  @Get()
  getPermissionsCatalog() {
    return {
      permissions: this.permTypesService.getAllPermissions(),
      defaults: {
        superadmin: this.permTypesService.getDefaultPermissionsByRole('superadmin'),
        manager: this.permTypesService.getDefaultPermissionsByRole('manager'),
        user: this.permTypesService.getDefaultPermissionsByRole('user'),
      },
    };
  }

  /**
   * Authenticated: Return current user's effective permissions within active enterprise context
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMyPermissions(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Query('enterpriseId') queryEnterpriseId?: string,
  ) {
    const enterpriseId =
      queryEnterpriseId ||
      (req.headers['x-enterprise-id'] as string) ||
      req.session?.activeEnterpriseId;

    return this.permTypesService.getUserEffectivePermissions(userId, enterpriseId);
  }
}
