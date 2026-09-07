import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, CurrentUser, CurrentSession } from '../common/index.js';
import { PermTypesGuard, RequirePermissions } from '../permtypes/index.js';
import { EnterpriseService } from './enterprise.service.js';
import { CreateEnterpriseDto, KeyLoginDto, SwitchEnterpriseDto, UpdateEnterpriseDto } from './dto/index.js';

@Controller('api/enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  /**
   * Public: Log in directly using credentials and an Enterprise Key
   */
  @Post('key-login')
  async keyLogin(@Body() dto: KeyLoginDto, @Res() res: Response) {
    const result = await this.enterpriseService.loginWithEnterpriseKey(dto);

    if (result.setCookie) {
      res.setHeader('Set-Cookie', result.setCookie);
    }

    return res.status(200).json({
      user: result.user,
      session: result.session,
      enterprise: result.enterprise,
      membership: result.membership,
    });
  }

  /**
   * Authenticated: Update enterprise workspace details
   * STRICT ACCESS: Only users with a Managerial role in this enterprise can update.
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateEnterprise(
    @CurrentUser('id') userId: string,
    @Param('id') enterpriseId: string,
    @Body() dto: UpdateEnterpriseDto,
  ) {
    return this.enterpriseService.updateEnterprise(userId, enterpriseId, dto);
  }

  /**
   * Authenticated: Create a new enterprise (requires enterprise:create permission)
   */
  @Post('create')
  @UseGuards(AuthGuard, PermTypesGuard)
  @RequirePermissions('enterprise:create')
  async createEnterprise(
    @CurrentUser('id') userId: string,
    @CurrentSession('id') sessionId: string,
    @Body() dto: CreateEnterpriseDto,
  ) {
    return this.enterpriseService.createEnterprise(userId, dto, sessionId);
  }

  /**
   * Authenticated: Rotate Enterprise Key (requires enterprise:manage permission)
   */
  @Post('rotate-key')
  @UseGuards(AuthGuard, PermTypesGuard)
  @RequirePermissions('enterprise:manage')
  async rotateKey(
    @CurrentUser('id') userId: string,
    @Body('enterpriseId') enterpriseId: string,
    @CurrentSession('activeEnterpriseId') activeEnterpriseId?: string,
  ) {
    const targetEnterpriseId = enterpriseId || activeEnterpriseId;
    if (!targetEnterpriseId) {
      throw new BadRequestException('Enterprise ID or active enterprise context is required');
    }
    return this.enterpriseService.rotateEnterpriseKey(userId, targetEnterpriseId);
  }

  /**
   * Authenticated: Switch active enterprise context via enterpriseKey or enterpriseId
   */
  @Post('switch')
  @UseGuards(AuthGuard)
  async switchEnterprise(
    @CurrentUser('id') userId: string,
    @CurrentSession('id') sessionId: string,
    @Body() body: SwitchEnterpriseDto,
  ) {
    return this.enterpriseService.switchEnterprise(userId, sessionId, body);
  }

  /**
   * Authenticated: Get current user profile, active enterprise context, and memberships
   */
  @Get('context')
  @UseGuards(AuthGuard)
  async getContext(
    @CurrentUser('id') userId: string,
    @CurrentSession('activeEnterpriseId') activeEnterpriseId?: string,
  ) {
    return this.enterpriseService.getCurrentContext(userId, activeEnterpriseId);
  }

  /**
   * Authenticated: Get current user's join requests
   */
  @Get('my-requests')
  @UseGuards(AuthGuard)
  async getMyRequests(@CurrentUser('id') userId: string) {
    return this.enterpriseService.getUserJoinRequests(userId);
  }
}
