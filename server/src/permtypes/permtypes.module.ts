import { Module } from '@nestjs/common';
import { PermTypesService } from './permtypes.service.js';
import { PermTypesGuard } from './permtypes.guard.js';
import { PermTypesController } from './permtypes.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PermissionsService } from '../permissions/permissions.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PermTypesController],
  providers: [
    PermTypesService,
    PermTypesGuard,
    {
      provide: PermissionsService,
      useExisting: PermTypesService,
    },
  ],
  exports: [PermTypesService, PermTypesGuard, PermissionsService],
})
export class PermTypesModule {}
