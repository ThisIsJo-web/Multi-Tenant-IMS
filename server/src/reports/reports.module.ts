import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { StockModule } from '../stock/stock.module.js';
import { PermTypesModule } from '../permtypes/permtypes.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [StockModule, PermTypesModule, PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
