import { Module } from '@nestjs/common';
import { ManagerApplicationService } from './manager-application.service.js';
import { ManagerApplicationController } from './manager-application.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ManagerApplicationController],
  providers: [ManagerApplicationService],
  exports: [ManagerApplicationService],
})
export class ManagerApplicationModule {}
