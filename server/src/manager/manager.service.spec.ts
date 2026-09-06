import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ManagerService } from './manager.service.js';
import { EnterpriseService } from '../enterprise/enterprise.service.js';
import { generateEnterpriseKey } from '../enterprise/utils/enterprise-key.util.js';

describe('Enterprise Key Join Requests & Permission Management', () => {
  let prisma: PrismaService;
  let managerService: ManagerService;
  let enterpriseService: EnterpriseService;

  beforeAll(async () => {
    process.loadEnvFile?.('.env');
    prisma = new PrismaService();
    await prisma.$connect();
    managerService = new ManagerService(prisma);
    enterpriseService = new EnterpriseService(prisma);

    // Upsert manager and user for tests
    await prisma.user.upsert({
      where: { email: 'manager-review-test@ims.local' },
      create: { name: 'Alex Manager', email: 'manager-review-test@ims.local', role: 'manager', canCreateEnterprise: true, emailVerified: true },
      update: { role: 'manager', canCreateEnterprise: true },
    });
    await prisma.user.upsert({
      where: { email: 'applicant-review-test@ims.local' },
      create: { name: 'Applicant User', email: 'applicant-review-test@ims.local', role: 'user', canCreateEnterprise: false, emailVerified: true },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.enterpriseJoinRequest.deleteMany({
      where: { user: { email: { in: ['manager-review-test@ims.local', 'applicant-review-test@ims.local'] } } },
    });
    await prisma.enterpriseMember.deleteMany({
      where: { user: { email: { in: ['manager-review-test@ims.local', 'applicant-review-test@ims.local'] } } },
    });
    await prisma.enterprise.deleteMany({ where: { slug: { startsWith: 'join-test-' } } });
    await prisma.user.deleteMany({
      where: { email: { in: ['manager-review-test@ims.local', 'applicant-review-test@ims.local'] } },
    });
    await prisma.$disconnect();
  });

  it('should create a pending EnterpriseJoinRequest when a non-member submits an Enterprise Key', async () => {
    const manager = await prisma.user.findUnique({ where: { email: 'manager-review-test@ims.local' } });
    const applicant = await prisma.user.findUnique({ where: { email: 'applicant-review-test@ims.local' } });

    // Create unique test enterprise
    const key = generateEnterpriseKey();
    const enterprise = await prisma.enterprise.create({
      data: {
        name: `Join Request Test Ent ${Date.now()}`,
        slug: `join-test-${Date.now()}`,
        enterpriseKey: key,
      },
    });

    // Make manager the manager member
    await prisma.enterpriseMember.create({
      data: {
        enterpriseId: enterprise.id,
        userId: manager!.id,
        role: 'manager',
        permissions: ['stock:view', 'enterprise:manage'],
      },
    });

    // Applicant submits key to join
    const result = await enterpriseService.switchEnterprise(applicant!.id, 'dummy-session-id', {
      enterpriseKey: key,
    });

    expect(result.status).toBe('request_created');
    expect(result.message).toContain('Awaiting manager review');
    expect(result.request).toBeDefined();

    // Verify pending request in Manager Service
    const pendingList = await managerService.getPendingJoinRequests(manager!.id, enterprise.id);
    expect(pendingList.length).toBe(1);
    expect(pendingList[0].email).toBe('applicant-review-test@ims.local');
    expect(pendingList[0].status).toBe('pending');
  });

  it('should allow manager to approve pending join request with specific permissions', async () => {
    const manager = await prisma.user.findUnique({ where: { email: 'manager-review-test@ims.local' } });
    const applicant = await prisma.user.findUnique({ where: { email: 'applicant-review-test@ims.local' } });

    // Find the enterprise and pending request
    const pendingRequest = await prisma.enterpriseJoinRequest.findFirst({
      where: { userId: applicant!.id, status: 'pending' },
      include: { enterprise: true },
    });

    expect(pendingRequest).toBeDefined();

    // Approve with custom permissions
    const approved = await managerService.approveJoinRequest(manager!.id, pendingRequest!.id, [
      'stock:view',
      'stock:receive',
      'stock:transfer',
    ]);

    expect(approved.member).toBeDefined();
    expect(approved.member.role).toBe('staff');
    expect(approved.member.permissions).toEqual(['stock:view', 'stock:receive', 'stock:transfer']);

    // Verify user is now active staff member
    const staffList = await managerService.getEnterpriseStaff(manager!.id, pendingRequest!.enterpriseId);
    const memberRecord = staffList.find((m) => m.userId === applicant!.id);
    expect(memberRecord).toBeDefined();
    expect(memberRecord!.permissions).toContain('stock:transfer');
  });

  it('should allow manager to edit permissions of existing staff member later on', async () => {
    const manager = await prisma.user.findUnique({ where: { email: 'manager-review-test@ims.local' } });
    const applicant = await prisma.user.findUnique({ where: { email: 'applicant-review-test@ims.local' } });

    const member = await prisma.enterpriseMember.findFirst({
      where: { userId: applicant!.id, role: 'staff' },
      orderBy: { createdAt: 'desc' },
    });

    expect(member).toBeDefined();

    // Update permissions
    const updated = await managerService.updateStaffPermissions(
      manager!.id,
      member!.enterpriseId,
      member!.id,
      ['stock:view', 'stock:adjust', 'stock:audit'],
    );

    expect(updated.member.permissions).toEqual(['stock:view', 'stock:adjust', 'stock:audit']);
  });
});
