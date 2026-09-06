import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EnterpriseModule } from './enterprise/enterprise.module.js';
import { SuperAdminModule } from './superadmin/superadmin.module.js';
import { ManagerModule } from './manager/manager.module.js';
import { ManagerApplicationModule } from './manager-application/manager-application.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    EnterpriseModule,
    SuperAdminModule,
    ManagerModule,
    ManagerApplicationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
