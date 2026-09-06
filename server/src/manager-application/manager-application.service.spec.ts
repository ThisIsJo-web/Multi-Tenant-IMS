import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ManagerApplicationService } from './manager-application.service.js';
import { ManagerService } from '../manager/manager.service.js';

describe('Manager Application & Staff Management', () => {
  let prisma: PrismaService;
  let appService: ManagerApplicationService;
  let managerService: ManagerService;

  beforeAll(async () => {
    process.loadEnvFile?.('.env');
    prisma = new PrismaService();
    await prisma.$connect();
    appService = new ManagerApplicationService(prisma);
    managerService = new ManagerService(prisma);

    // Upsert test users
    await prisma.user.upsert({
      where: { email: 'superadmin-spec@ims.local' },
      create: { name: 'Super Admin', email: 'superadmin-spec@ims.local', role: 'superadmin', canCreateEnterprise: true, emailVerified: true },
      update: { role: 'superadmin', canCreateEnterprise: true },
    });
    const manager = await prisma.user.upsert({
      where: { email: 'manager@ims.local' },
      create: { name: 'Alex Manager', email: 'manager@ims.local', role: 'manager', canCreateEnterprise: true, emailVerified: true },
      update: { role: 'manager', canCreateEnterprise: true },
    });
    const staff = await prisma.user.upsert({
      where: { email: 'staff@ims.local' },
      create: { name: 'Sam Staff', email: 'staff@ims.local', role: 'user', canCreateEnterprise: false, emailVerified: true },
      update: { role: 'user', canCreateEnterprise: false },
    });

    // Upsert default enterprise
    let enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });
    if (!enterprise) {
      enterprise = await prisma.enterprise.create({
        data: { name: 'Apex Logistics Global', slug: 'apex-logistics', enterpriseKey: 'ENT-APEX-1234-DEMO' },
      });
    }

    // Ensure manager & staff memberships
    await prisma.enterpriseMember.upsert({
      where: { enterpriseId_userId: { enterpriseId: enterprise.id, userId: manager.id } },
      create: { enterpriseId: enterprise.id, userId: manager.id, role: 'manager', permissions: ['stock:view', 'enterprise:manage'] },
      update: { role: 'manager' },
    });
    await prisma.enterpriseMember.upsert({
      where: { enterpriseId_userId: { enterpriseId: enterprise.id, userId: staff.id } },
      create: { enterpriseId: enterprise.id, userId: staff.id, role: 'staff', permissions: ['stock:view'] },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.managerApplication.deleteMany({
      where: { user: { email: { in: ['staff-app-test@ims.local', 'manager-app-test@ims.local', 'reviewer-app-test@ims.local', 'superadmin-app-test@ims.local', 'staff@ims.local', 'manager@ims.local', 'reviewer@ims.local', 'superadmin-spec@ims.local'] } } },
    });
    await prisma.enterpriseMember.deleteMany({
      where: { user: { email: { in: ['staff-app-test@ims.local', 'manager-app-test@ims.local', 'reviewer-app-test@ims.local', 'superadmin-app-test@ims.local', 'staff@ims.local', 'manager@ims.local', 'reviewer@ims.local', 'superadmin-spec@ims.local'] } } },
    });
    await prisma.enterprise.deleteMany({ where: { slug: 'apex-logistics' } });
    await prisma.user.deleteMany({
      where: { email: { in: ['staff-app-test@ims.local', 'manager-app-test@ims.local', 'reviewer-app-test@ims.local', 'superadmin-app-test@ims.local', 'staff@ims.local', 'manager@ims.local', 'reviewer@ims.local', 'superadmin-spec@ims.local'] } },
    });
    await prisma.$disconnect();
  });

  describe('Managerial Role Application Flow', () => {
    it('should allow a regular user to submit an application', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      expect(staff).toBeDefined();

      // Reset staff to 'user' role and clean any existing applications
      await prisma.user.update({
        where: { id: staff!.id },
        data: { role: 'user', canCreateEnterprise: false },
      });
      await prisma.managerApplication.deleteMany({ where: { userId: staff!.id } });

      const submitted = await appService.createApplication(staff!.id, {
        enterpriseName: 'Horizon Freight Solutions',
        industry: 'Maritime Shipping',
        businessScale: 'Enterprise (500+ employees)',
        reason: 'Need dedicated workspace for cargo manifests and multi-warehouse stock management.',
      });

      expect(submitted.application).toBeDefined();
      expect(submitted.application.status).toBe('pending');
      expect(submitted.application.enterpriseName).toBe('Horizon Freight Solutions');
    });

    it('should retrieve the user application status', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      const myApp = await appService.getMyApplication(staff!.id);

      expect(myApp).toBeDefined();
      expect(myApp!.status).toBe('pending');
    });

    it('should allow SuperAdmin to approve application and promote user to manager role', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      const superAdmin = await prisma.user.findUnique({ where: { email: 'superadmin-spec@ims.local' } });
      const myApp = await appService.getMyApplication(staff!.id);

      expect(myApp).toBeDefined();

      const approved = await appService.reviewApplication(myApp!.id, superAdmin!.id, {
        status: 'approved',
        reviewerNotes: 'Verified maritime logistics operations. Approved.',
      });

      expect(approved.application.status).toBe('approved');
      expect(approved.application.user.role).toBe('manager');
      expect(approved.application.user.canCreateEnterprise).toBe(true);

      // Verify in DB
      const updatedUser = await prisma.user.findUnique({ where: { id: staff!.id } });
      expect(updatedUser!.role).toBe('manager');
      expect(updatedUser!.canCreateEnterprise).toBe(true);

      // Reset staff for future clean state
      await prisma.user.update({
        where: { id: staff!.id },
        data: { role: 'user', canCreateEnterprise: false },
      });
    });
  });

  describe('Manager Staff Management', () => {
    it('should list staff members inside the enterprise', async () => {
      const manager = await prisma.user.findUnique({ where: { email: 'manager@ims.local' } });
      const enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });

      const staffList = await managerService.getEnterpriseStaff(manager!.id, enterprise!.id);
      expect(staffList.length).toBeGreaterThan(0);
      expect(staffList[0]).toHaveProperty('name');
      expect(staffList[0]).toHaveProperty('role');
      expect(staffList[0]).toHaveProperty('permissions');
    });
  });
});
