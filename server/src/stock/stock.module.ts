import { Module } from '@nestjs/common';
import { StockService } from './stock.service.js';
import { StockController } from './stock.controller.js';
import { PermTypesModule } from '../permtypes/permtypes.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PermTypesModule, PrismaModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
