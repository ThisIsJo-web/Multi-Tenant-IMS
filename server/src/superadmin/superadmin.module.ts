import { Module } from '@nestjs/common';
import { SuperAdminController } from './superadmin.controller.js';
import { EnterpriseModule } from '../enterprise/enterprise.module.js';
import { PermTypesModule } from '../permtypes/permtypes.module.js';

@Module({
  imports: [EnterpriseModule, PermTypesModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
