import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service.js';
import { ManagerController } from './manager.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
