import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL database via Prisma...');
    await this.$connect();
    this.logger.log('Prisma connected successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Prisma client...');
    await this.$disconnect();
  }
}
