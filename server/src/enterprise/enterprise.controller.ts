import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, CurrentUser, CurrentSession } from '../common/index.js';
import { EnterpriseService } from './enterprise.service.js';
import { CreateEnterpriseDto, KeyLoginDto, SwitchEnterpriseDto } from './dto/index.js';

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
   * Authenticated: Create a new enterprise (requires canCreateEnterprise or superadmin)
   */
  @Post('create')
  @UseGuards(AuthGuard)
  async createEnterprise(
    @CurrentUser('id') userId: string,
    @CurrentSession('id') sessionId: string,
    @Body() dto: CreateEnterpriseDto,
  ) {
    return this.enterpriseService.createEnterprise(userId, dto, sessionId);
  }

  /**
   * Authenticated: Rotate Enterprise Key (requires manager role in enterprise or superadmin)
   */
  @Post('rotate-key')
  @UseGuards(AuthGuard)
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
