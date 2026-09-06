import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { auth, prisma, closeAuthPool, type Auth } from './auth.js';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);

  get instance(): Auth {
    return auth;
  }

  get api() {
    return auth.api;
  }

  get prisma() {
    return prisma;
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing auth database connection...');
    await closeAuthPool();
  }
}
