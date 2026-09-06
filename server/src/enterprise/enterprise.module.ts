import { Module } from '@nestjs/common';
import { EnterpriseController } from './enterprise.controller.js';
import { EnterpriseService } from './enterprise.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
