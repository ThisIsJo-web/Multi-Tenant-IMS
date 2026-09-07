import { Injectable } from '@nestjs/common';
import { StockService } from '../stock/stock.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly stockService: StockService) {}

  /**
   * Action: reports:view
   */
  async getInventorySummary(enterpriseId: string) {
    const items = await this.stockService.listStock(enterpriseId);
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const logs = await this.stockService.getAuditLogs(enterpriseId);

    return {
      enterpriseId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSkus: items.length,
        totalUnitsInStock: totalUnits,
        totalAuditTransactions: logs.length,
        stockStatus: totalUnits > 100 ? 'HEALTHY' : 'LOW_STOCK',
      },
      inventory: items,
    };
  }

  /**
   * Action: reports:export
   */
  async exportInventoryCsv(enterpriseId: string): Promise<string> {
    const items = await this.stockService.listStock(enterpriseId);
    const headers = 'SKU,Item Name,Quantity,Location,Last Updated,Updated By\n';
    const rows = items
      .map(
        (i) =>
          `"${i.sku}","${i.name}",${i.quantity},"${i.location}","${i.lastUpdated}","${i.updatedBy}"`,
      )
      .join('\n');
    return headers + rows;
  }
}
