import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../auth/auth.js';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = fromNodeHeaders(request.headers);

    try {
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        this.logger.debug(
          `Unauthorized access attempt: ${request.method} ${request.originalUrl || request.url} (IP: ${request.ip || 'unknown'})`,
        );
        throw new UnauthorizedException('Authentication required');
      }

      // Attach user and session to request context for downstream handlers/decorators
      (request as any).user = session.user;
      (request as any).session = session.session;

      this.logger.debug(
        `Authenticated user: ${session.user.id} (${session.user.email}) for ${request.method} ${request.originalUrl || request.url}`,
      );
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.error(`Error resolving session: ${err.message}`, err.stack);
      throw new UnauthorizedException('Authentication verification failed');
    }
  }
}
