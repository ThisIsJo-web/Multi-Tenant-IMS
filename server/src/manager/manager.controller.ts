import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../common/index.js';
import { PermTypesGuard, RequirePermissions } from '../permtypes/index.js';
import { ManagerService } from './manager.service.js';
import { AddStaffDto } from './dto/add-staff.dto.js';

@Controller('api/manager')
@UseGuards(AuthGuard, PermTypesGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**
   * Action: users:manage
   * Manager: List all staff inside a specific enterprise
   */
  @Get('enterprises/:id/staff')
  @RequirePermissions('users:manage')
  async getStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.managerService.getEnterpriseStaff(managerId, enterpriseId);
  }

  /**
   * Action: users:manage
   * Manager: Add/assign a staff member to the enterprise
   */
  @Post('enterprises/:id/staff')
  @RequirePermissions('users:manage')
  async addStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
    @Body() dto: AddStaffDto,
  ) {
    return this.managerService.addStaffMember(managerId, enterpriseId, dto);
  }

  /**
   * Action: permissions:grant
   * Manager: List pending join requests for an enterprise
   */
  @Get('enterprises/:id/join-requests')
  @RequirePermissions('permissions:grant')
  async getJoinRequests(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.managerService.getPendingJoinRequests(managerId, enterpriseId);
  }

  /**
   * Action: permissions:grant
   * Manager: Approve a pending join request with specific permissions
   */
  @Post('join-requests/:requestId/approve')
  @RequirePermissions('permissions:grant')
  async approveRequest(
    @CurrentUser('id') managerId: string,
    @Param('requestId') requestId: string,
    @Body('permissions') permissions?: string[],
  ) {
    return this.managerService.approveJoinRequest(managerId, requestId, permissions);
  }

  /**
   * Action: permissions:grant
   * Manager: Reject a pending join request
   */
  @Post('join-requests/:requestId/reject')
  @RequirePermissions('permissions:grant')
  async rejectRequest(
    @CurrentUser('id') managerId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.managerService.rejectJoinRequest(managerId, requestId);
  }

  /**
   * Action: permissions:grant
   * Manager: Edit permissions for an active staff member
   */
  @Patch('enterprises/:id/staff/:memberId/permissions')
  @RequirePermissions('permissions:grant')
  async updatePermissions(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
    @Param('memberId') memberId: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.managerService.updateStaffPermissions(
      managerId,
      enterpriseId,
      memberId,
      permissions,
    );
  }

  /**
   * Action: users:manage
   * Manager: Remove staff member from enterprise
   */
  @Delete('enterprises/:id/staff/:memberId')
  @RequirePermissions('users:manage')
  async removeStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.managerService.removeStaffMember(managerId, enterpriseId, memberId);
  }
}
