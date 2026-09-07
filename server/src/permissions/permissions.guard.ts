import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator.js';
import { PermissionCode, MANAGER_DEFAULT_PERMISSIONS } from './permissions.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required to verify permissions');
    }

    // 1. SuperAdmin: All permissions granted unconditionally
    if (user.role === 'superadmin') {
      return true;
    }

    // 2. Platform-level enterprise creation check
    if (
      requiredPermissions.length === 1 &&
      requiredPermissions[0] === 'enterprise:create' &&
      (user.role === 'manager' || user.canCreateEnterprise)
    ) {
      return true;
    }

    // 3. Resolve active enterprise scope
    const enterpriseId =
      request.params?.id ||
      request.params?.enterpriseId ||
      request.session?.activeEnterpriseId ||
      request.body?.enterpriseId ||
      request.query?.enterpriseId;

    let userPermissions: string[] = [];

    if (enterpriseId) {
      const membership = await this.prisma.enterpriseMember.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId,
            userId: user.id,
          },
        },
      });

      if (membership) {
        if (membership.role === 'manager') {
          // Managers inside their enterprise possess all manager-level permissions
          userPermissions = [...MANAGER_DEFAULT_PERMISSIONS];
        } else {
          // Staff members possess only their assigned permissions
          userPermissions = membership.permissions || [];
        }
      }
    }

    const userPermSet = new Set(userPermissions);
    const missingPermissions = requiredPermissions.filter((p) => !userPermSet.has(p));

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Insufficient permissions. Missing: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
