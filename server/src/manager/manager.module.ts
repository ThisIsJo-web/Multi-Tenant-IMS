import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service.js';
import { ManagerController } from './manager.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PermTypesModule } from '../permtypes/permtypes.module.js';

@Module({
  imports: [AuthModule, PermTypesModule],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
