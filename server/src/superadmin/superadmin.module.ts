import { Module } from '@nestjs/common';
import { SuperAdminController } from './superadmin.controller.js';
import { EnterpriseModule } from '../enterprise/enterprise.module.js';

@Module({
  imports: [EnterpriseModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
