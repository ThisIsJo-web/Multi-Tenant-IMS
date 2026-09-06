import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(SuperAdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: Record<string, any> }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role !== 'superadmin') {
      this.logger.warn(`User ${user.id} (${user.email}) attempted to access superadmin resource without permissions.`);
      throw new ForbiddenException('SuperAdmin privileges required');
    }

    return true;
  }
}
