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
    const isEnterpriseScopedParam =
      request.baseUrl?.includes('enterprise') ||
      request.path?.includes('/enterprise') ||
      request.route?.path?.includes('/enterprise');

    let enterpriseId =
      (request.headers['x-enterprise-id'] as string) ||
      request.params?.enterpriseId ||
      (isEnterpriseScopedParam ? request.params?.id : undefined) ||
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

    // Fallback if enterpriseId was not specified in the request or membership not found yet:
    if (!membership && !enterpriseId) {
      // 1. Check session in DB for activeEnterpriseId
      if (request.session?.id) {
        const dbSession = await this.prisma.session.findUnique({
          where: { id: request.session.id },
          select: { activeEnterpriseId: true },
        });
        if (dbSession?.activeEnterpriseId) {
          const sMem = await this.prisma.enterpriseMember.findUnique({
            where: {
              enterpriseId_userId: {
                enterpriseId: dbSession.activeEnterpriseId,
                userId: user.id,
              },
            },
          });
          if (sMem) {
            enterpriseId = dbSession.activeEnterpriseId;
            membership = sMem;
          }
        }
      }

      // 2. Check product's enterprise if SKU is in route or body
      const skuCandidate = request.params?.sku || request.body?.sku;
      if (!membership && skuCandidate && typeof skuCandidate === 'string') {
        const prod = await this.prisma.product.findFirst({
          where: { sku: skuCandidate.trim().toUpperCase() },
          select: { enterpriseId: true },
        });
        if (prod) {
          const pMem = await this.prisma.enterpriseMember.findUnique({
            where: {
              enterpriseId_userId: {
                enterpriseId: prod.enterpriseId,
                userId: user.id,
              },
            },
          });
          if (pMem) {
            enterpriseId = prod.enterpriseId;
            membership = pMem;
          }
        }
      }

      // 3. Fallback to user's enterprise memberships (supports both managers and staff)
      if (!membership) {
        const userMemberships = await this.prisma.enterpriseMember.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        });

        if (userMemberships.length > 0) {
          // If user has a manager role in any, prefer that; otherwise take first valid membership
          const preferred = userMemberships.find((m) => m.role === 'manager') || userMemberships[0];
          enterpriseId = preferred.enterpriseId;
          membership = preferred;
        }
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
