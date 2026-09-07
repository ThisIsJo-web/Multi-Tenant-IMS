import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { PermTypesGuard } from '../permtypes/permtypes.guard.js';
import { RequirePermissions } from '../permtypes/permtypes.decorator.js';
import { ReportsService } from './reports.service.js';

@Controller('api/reports')
@UseGuards(AuthGuard, PermTypesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private resolveEnterpriseId(req: any): string {
    const enterpriseId =
      req.enterpriseId ||
      req.headers['x-enterprise-id'] ||
      req.session?.activeEnterpriseId ||
      req.body?.enterpriseId;

    if (!enterpriseId) {
      throw new BadRequestException(
        'Active enterprise context is required to generate reports',
      );
    }
    return enterpriseId;
  }

  /**
   * Action: reports:view
   * View high-level inventory reports and stock analytics.
   */
  @Get('summary')
  @RequirePermissions('reports:view')
  async getSummary(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.reportsService.getInventorySummary(enterpriseId);
  }

  /**
   * Action: reports:export
   * Export inventory records as CSV.
   */
  @Get('export')
  @RequirePermissions('reports:export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory-report.csv"')
  async exportCsv(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return await this.reportsService.exportInventoryCsv(enterpriseId);
  }

  /**
   * Action: reports:export
   * Export via POST for programmatic integration.
   */
  @Post('export')
  @RequirePermissions('reports:export')
  async exportCsvPost(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    const csv = await this.reportsService.exportInventoryCsv(enterpriseId);
    return {
      enterpriseId,
      format: 'csv',
      data: csv,
      exportedAt: new Date().toISOString(),
    };
  }
}
