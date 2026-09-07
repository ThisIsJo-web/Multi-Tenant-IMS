import { Module } from '@nestjs/common';
import { EnterpriseController } from './enterprise.controller.js';
import { EnterpriseService } from './enterprise.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PermTypesModule } from '../permtypes/permtypes.module.js';

@Module({
  imports: [PrismaModule, PermTypesModule],
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
