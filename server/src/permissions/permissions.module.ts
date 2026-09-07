import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsGuard } from './permissions.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
