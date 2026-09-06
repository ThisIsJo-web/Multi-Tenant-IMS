import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, SuperAdminGuard, CurrentUser } from '../common/index.js';
import { ManagerApplicationService } from './manager-application.service.js';
import { ApplyManagerDto } from './dto/apply-manager.dto.js';
import { ReviewApplicationDto } from './dto/review-application.dto.js';

@Controller('api/manager-applications')
@UseGuards(AuthGuard)
export class ManagerApplicationController {
  constructor(private readonly appService: ManagerApplicationService) {}

  /**
   * User: Submit a managerial role application
   */
  @Post()
  async submitApplication(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyManagerDto,
  ) {
    return this.appService.createApplication(userId, dto);
  }

  /**
   * User: Check status of their own application
   */
  @Get('my')
  async getMyApplication(@CurrentUser('id') userId: string) {
    const application = await this.appService.getMyApplication(userId);
    return { application: application || null };
  }

  /**
   * SuperAdmin: List all applications
   */
  @Get()
  @UseGuards(SuperAdminGuard)
  async getAllApplications() {
    return this.appService.getAllApplications();
  }

  /**
   * SuperAdmin: Review (approve or reject) application
   */
  @Post(':id/review')
  @UseGuards(SuperAdminGuard)
  async reviewApplication(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.appService.reviewApplication(id, reviewerId, dto);
  }
}
