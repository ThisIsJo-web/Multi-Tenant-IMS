import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PermTypesGuard } from '../permtypes/permtypes.guard.js';
import { RequirePermissions } from '../permtypes/permtypes.decorator.js';
import { StockService } from './stock.service.js';
import { BaseUnit, LocationType, TrackingMode } from './stock.types.js';

@Controller('api/stock')
@UseGuards(AuthGuard, PermTypesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  private resolveEnterpriseId(req: any): string {
    const enterpriseId =
      req.enterpriseId ||
      req.headers['x-enterprise-id'] ||
      req.session?.activeEnterpriseId ||
      req.query?.enterpriseId ||
      req.body?.enterpriseId;

    if (!enterpriseId) {
      throw new BadRequestException(
        'Active enterprise context is required to perform stock operations',
      );
    }
    return enterpriseId;
  }

  // ==========================================
  // 1. DASHBOARD BIRD'S-EYE VIEW SUMMARY
  // ==========================================

  @Get('summary')
  @RequirePermissions('stock:view')
  async getDashboardSummary(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.getDashboardSummary(enterpriseId);
  }

  // ==========================================
  // 2. PRODUCTS & CATALOG
  // ==========================================

  @Get('products')
  @RequirePermissions('stock:view')
  async listProducts(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.listProducts(enterpriseId);
  }

  @Get('products/:sku')
  @RequirePermissions('stock:view')
  async getProduct(@Req() req: any, @Param('sku') sku: string) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.getProductBySku(enterpriseId, sku);
  }

  @Post('products')
  @RequirePermissions('stock:receive')
  async createProduct(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body()
    body: {
      sku: string;
      name: string;
      baseUnit?: BaseUnit;
      trackingMode?: TrackingMode;
      reorderThreshold?: number;
      initialLocationId?: string;
      initialQuantity?: number;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.createProduct(
      enterpriseId,
      body,
      user?.name || user?.email || 'User',
      user?.role || 'staff',
    );
  }

  @Patch('products/:sku')
  @RequirePermissions('stock:adjust')
  async updateProduct(
    @Req() req: any,
    @Param('sku') sku: string,
    @Body()
    body: {
      name?: string;
      baseUnit?: BaseUnit;
      trackingMode?: TrackingMode;
      reorderThreshold?: number;
      reserved?: number;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.updateProduct(enterpriseId, sku, body);
  }

  @Delete('products/:sku')
  @RequirePermissions('stock:adjust')
  async deleteProduct(@Req() req: any, @Param('sku') sku: string) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.deleteProduct(enterpriseId, sku);
  }

  // ==========================================
  // 3. LOCATIONS & BINS
  // ==========================================

  @Get('locations')
  @RequirePermissions('stock:view')
  async listLocations(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.listLocations(enterpriseId);
  }

  @Post('locations')
  @RequirePermissions('stock:receive')
  async createLocation(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      type: LocationType;
      parentId?: string | null;
      code?: string;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.createLocation(enterpriseId, body);
  }

  @Delete('locations/:id')
  @RequirePermissions('stock:adjust')
  async deleteLocation(@Req() req: any, @Param('id') id: string) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.deleteLocation(enterpriseId, id);
  }

  // ==========================================
  // 4. OPERATIONS (INBOUND, TRANSFER, OUTBOUND)
  // ==========================================

  /**
   * Inbound: Receive Stock
   */
  @Post('operations/receive')
  @RequirePermissions('stock:receive')
  async receiveStockOperation(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body()
    body: {
      sku: string;
      destinationLocationId: string;
      quantity: number;
      reference?: string;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.receiveStockBlueprint(
      enterpriseId,
      user?.id,
      user?.name || user?.email || 'User',
      user?.role || 'staff',
      body,
    );
  }

  /**
   * Transfer: Move between locations
   */
  @Post('operations/transfer')
  @RequirePermissions('stock:transfer')
  async transferStockOperation(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body()
    body: {
      sku: string;
      fromLocationId: string;
      toLocationId: string;
      quantity: number;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.transferStockBlueprint(
      enterpriseId,
      user?.id,
      user?.name || user?.email || 'User',
      user?.role || 'staff',
      body,
    );
  }

  /**
   * Outbound: Dispatch stock to customer / external
   */
  @Post('operations/dispatch')
  @RequirePermissions('stock:transfer')
  async dispatchStockOperation(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body()
    body: {
      sku: string;
      fromLocationId: string;
      quantity: number;
      reference?: string;
    },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.dispatchStockBlueprint(
      enterpriseId,
      user?.id,
      user?.name || user?.email || 'User',
      user?.role || 'staff',
      body,
    );
  }

  // ==========================================
  // 5. STOCK LEDGER (AUDIT STATEMENT)
  // ==========================================

  @Get('ledger')
  @RequirePermissions('stock:view')
  async getLedger(
    @Req() req: any,
    @Query('sku') sku?: string,
    @Query('action') action?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return this.stockService.getLedger(enterpriseId, { sku, action, location, search });
  }

  // ==========================================
  // 6. BACKWARD COMPATIBILITY ENDPOINTS
  // ==========================================

  @Get()
  @RequirePermissions('stock:view')
  async listStock(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return {
      enterpriseId,
      items: await this.stockService.listStock(enterpriseId),
    };
  }

  @Post('receive')
  @RequirePermissions('stock:receive')
  async receiveStock(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Body() body: { sku: string; name?: string; quantity: number; location?: string },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return await this.stockService.receiveStock(enterpriseId, userId, body);
  }

  @Post('transfer')
  @RequirePermissions('stock:transfer')
  async transferStock(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Body() body: { sku: string; fromLocation: string; toLocation: string; quantity: number },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return await this.stockService.transferStock(enterpriseId, userId, body);
  }

  @Post('adjust')
  @RequirePermissions('stock:adjust')
  async adjustStock(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Body() body: { sku: string; adjustment: number; reason: string },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return await this.stockService.adjustStock(enterpriseId, userId, body);
  }

  @Post('audit')
  @RequirePermissions('stock:audit')
  async auditStock(
    @CurrentUser('id') userId: string,
    @Req() req: any,
    @Body() body: { sku: string; countedQuantity: number; notes: string },
  ) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return await this.stockService.auditStock(enterpriseId, userId, body);
  }

  @Get('audit-logs')
  @RequirePermissions('stock:audit')
  async getAuditLogs(@Req() req: any) {
    const enterpriseId = this.resolveEnterpriseId(req);
    return {
      enterpriseId,
      logs: await this.stockService.getAuditLogs(enterpriseId),
    };
  }
}
