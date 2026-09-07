import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permtypes.decorator.js';
import { PermissionCode } from './permtypes.definitions.js';
import { PermissionChecker } from './permtypes.checker.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PermTypesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route does not declare any required permissions, allow pass-through
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required to verify permissions');
    }

    // 1. SuperAdmin: Unconditional God-Mode bypass
    if (user.role === 'superadmin') {
      return true;
    }

    // 2. Resolve target enterprise context from HTTP request
    let enterpriseId =
      (request.headers['x-enterprise-id'] as string) ||
      request.params?.enterpriseId ||
      request.params?.id ||
      request.session?.activeEnterpriseId ||
      request.body?.enterpriseId ||
      (request.query?.enterpriseId as string);

    // If route has requestId (e.g. /api/manager/join-requests/:requestId/approve), resolve from join request
    if (!enterpriseId && request.params?.requestId) {
      const joinReq = await this.prisma.enterpriseJoinRequest.findUnique({
        where: { id: request.params.requestId },
        select: { enterpriseId: true },
      });
      if (joinReq) {
        enterpriseId = joinReq.enterpriseId;
      }
    }

    // If route has memberId, resolve from member record
    if (!enterpriseId && request.params?.memberId) {
      const memberRec = await this.prisma.enterpriseMember.findUnique({
        where: { id: request.params.memberId },
        select: { enterpriseId: true },
      });
      if (memberRec) {
        enterpriseId = memberRec.enterpriseId;
      }
    }

    let membership = null;

    if (enterpriseId) {
      membership = await this.prisma.enterpriseMember.findUnique({
        where: {
          enterpriseId_userId: {
            enterpriseId,
            userId: user.id,
          },
        },
      });
    }

    // Fallback: If user is a manager in any enterprise and enterpriseId was not specified in the URL,
    // resolve to their manager membership
    if (!membership && !enterpriseId) {
      const mgrMem = await this.prisma.enterpriseMember.findFirst({
        where: {
          userId: user.id,
          role: 'manager',
        },
      });
      if (mgrMem) {
        enterpriseId = mgrMem.enterpriseId;
        membership = mgrMem;
      }
    }

    if (enterpriseId) {
      // Attach context to request for downstream controller use
      request.enterpriseId = enterpriseId;
      request.membership = membership;
    }

    // 3. Delegate to PermissionChecker to enforce authorization hierarchy
    PermissionChecker.assert(user, membership, requiredPermissions);

    return true;
  }
}
