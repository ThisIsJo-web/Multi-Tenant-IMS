import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../common/index.js';
import { PermTypesGuard, RequirePermissions } from '../permtypes/index.js';
import { EnterpriseService } from '../enterprise/enterprise.service.js';

@Controller('api/admin')
@UseGuards(AuthGuard, PermTypesGuard)
@RequirePermissions('system:manage')
export class SuperAdminController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  /**
   * Action: system:manage
   * SuperAdmin: List all users on platform with role, enterprise memberships, and canCreateEnterprise flag
   */
  @Get('users')
  async getAllUsers() {
    return this.enterpriseService.getAllUsers();
  }

  /**
   * Action: system:manage
   * SuperAdmin: Toggle or set canCreateEnterprise permission on any user
   */
  @Post('users/:id/toggle-can-create-enterprise')
  async toggleCanCreateEnterprise(
    @Param('id') targetUserId: string,
    @Body('canCreateEnterprise') canCreateEnterprise?: boolean,
  ) {
    return this.enterpriseService.toggleCanCreateEnterprise(targetUserId, canCreateEnterprise);
  }

  /**
   * Action: system:manage
   * SuperAdmin: List all enterprises across the platform with keys and member stats
   */
  @Get('enterprises')
  async getAllEnterprises() {
    return this.enterpriseService.getAllEnterprises();
  }

  /**
   * Action: system:manage
   * SuperAdmin: Remove Enterprise workspace freely
   */
  @Delete('enterprises/:id')
  async deleteEnterprise(
    @CurrentUser('id') userId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.enterpriseService.deleteEnterprise(userId, enterpriseId);
  }

  @Post('enterprises/:id/delete')
  async deleteEnterprisePost(
    @CurrentUser('id') userId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.enterpriseService.deleteEnterprise(userId, enterpriseId);
  }
}
