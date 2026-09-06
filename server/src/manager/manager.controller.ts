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
import { ManagerService } from './manager.service.js';
import { AddStaffDto } from './dto/add-staff.dto.js';

@Controller('api/manager')
@UseGuards(AuthGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  /**
   * Manager: List all staff inside a specific enterprise
   */
  @Get('enterprises/:id/staff')
  async getStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.managerService.getEnterpriseStaff(managerId, enterpriseId);
  }

  /**
   * Manager: Add/assign a staff member to the enterprise
   */
  @Post('enterprises/:id/staff')
  async addStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
    @Body() dto: AddStaffDto,
  ) {
    return this.managerService.addStaffMember(managerId, enterpriseId, dto);
  }

  /**
   * Manager: List pending join requests for an enterprise
   */
  @Get('enterprises/:id/join-requests')
  async getJoinRequests(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
  ) {
    return this.managerService.getPendingJoinRequests(managerId, enterpriseId);
  }

  /**
   * Manager: Approve a pending join request with specific permissions
   */
  @Post('join-requests/:requestId/approve')
  async approveRequest(
    @CurrentUser('id') managerId: string,
    @Param('requestId') requestId: string,
    @Body('permissions') permissions?: string[],
  ) {
    return this.managerService.approveJoinRequest(managerId, requestId, permissions);
  }

  /**
   * Manager: Reject a pending join request
   */
  @Post('join-requests/:requestId/reject')
  async rejectRequest(
    @CurrentUser('id') managerId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.managerService.rejectJoinRequest(managerId, requestId);
  }

  /**
   * Manager: Edit permissions for an active staff member
   */
  @Patch('enterprises/:id/staff/:memberId/permissions')
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
   * Manager: Remove staff member from enterprise
   */
  @Delete('enterprises/:id/staff/:memberId')
  async removeStaff(
    @CurrentUser('id') managerId: string,
    @Param('id') enterpriseId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.managerService.removeStaffMember(managerId, enterpriseId, memberId);
  }
}
