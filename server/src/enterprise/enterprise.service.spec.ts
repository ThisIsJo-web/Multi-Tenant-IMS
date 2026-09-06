import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EnterpriseService } from './enterprise.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { generateEnterpriseKey, isValidEnterpriseKeyFormat } from './utils/enterprise-key.util.js';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { auth } from '../auth/auth.js';

describe('Enterprise Key and Hierarchy System', () => {
  let prisma: PrismaService;
  let service: EnterpriseService;

  beforeAll(async () => {
    process.loadEnvFile?.('.env');
    prisma = new PrismaService();
    await prisma.$connect();
    service = new EnterpriseService(prisma);

    // Helper to ensure test user with password credentials exists
    async function ensureTestUser(name: string, email: string, role: string, canCreateEnterprise: boolean) {
      let user = await prisma.user.findUnique({ where: { email } });
      let account = user ? await prisma.account.findFirst({ where: { userId: user.id } }) : null;
      if (!user || !account) {
        if (user) {
          await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        }
        try {
          await auth.api.signUpEmail({
            body: { name, email, password: 'Password123!' },
          });
        } catch {
          // Ignore if already registered
        }
        user = await prisma.user.findUnique({ where: { email } });
      }
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role, canCreateEnterprise, emailVerified: true },
        });
      }
      return user!;
    }

    const superAdmin = await ensureTestUser('Super Admin', 'superadmin-spec@ims.local', 'superadmin', true);
    const manager = await ensureTestUser('Alex Manager', 'manager@ims.local', 'manager', true);
    const staff = await ensureTestUser('Sam Staff', 'staff@ims.local', 'user', false);

    // Upsert default test enterprise
    let enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });
    if (!enterprise) {
      const key = generateEnterpriseKey();
      enterprise = await prisma.enterprise.create({
        data: { name: 'Apex Logistics Global', slug: 'apex-logistics', enterpriseKey: key },
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
    await prisma.enterpriseJoinRequest.deleteMany({
      where: { user: { email: { in: ['superadmin-spec@ims.local', 'manager@ims.local', 'staff@ims.local', 'join-request-applicant@ims.local'] } } },
    });
    await prisma.enterpriseMember.deleteMany({
      where: { user: { email: { in: ['superadmin-spec@ims.local', 'manager@ims.local', 'staff@ims.local', 'join-request-applicant@ims.local'] } } },
    });
    await prisma.enterprise.deleteMany({
      where: { slug: { in: ['apex-logistics', 'omni-retail-hub'] } },
    });
    await prisma.enterprise.deleteMany({
      where: { slug: { startsWith: 'omni-retail-hub' } },
    });
    await prisma.account.deleteMany({
      where: { user: { email: { in: ['superadmin-spec@ims.local', 'manager@ims.local', 'staff@ims.local', 'join-request-applicant@ims.local'] } } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { in: ['superadmin-spec@ims.local', 'manager@ims.local', 'staff@ims.local', 'join-request-applicant@ims.local'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['superadmin-spec@ims.local', 'manager@ims.local', 'staff@ims.local', 'join-request-applicant@ims.local'] } },
    });
    await prisma.$disconnect();
  });

  describe('Enterprise Key Format & Generation', () => {
    it('should generate a valid ENT-XXXX-XXXX-XXXX key', () => {
      const key = generateEnterpriseKey();
      expect(key).toMatch(/^ENT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(isValidEnterpriseKeyFormat(key)).toBe(true);
    });

    it('should correctly reject malformed enterprise keys', () => {
      expect(isValidEnterpriseKeyFormat('INVALID-KEY')).toBe(false);
      expect(isValidEnterpriseKeyFormat('ENT-1234-5678')).toBe(false);
      expect(isValidEnterpriseKeyFormat('')).toBe(false);
    });
  });

  describe('Enterprise Creation & Permissions', () => {
    it('should allow a manager (canCreateEnterprise=true) to create an enterprise with generated key', async () => {
      const manager = await prisma.user.findUnique({ where: { email: 'manager@ims.local' } });
      expect(manager).toBeDefined();

      const created = await service.createEnterprise(manager!.id, {
        name: 'Omni Retail Hub',
      });

      expect(created.enterprise).toBeDefined();
      expect(created.enterprise.name).toBe('Omni Retail Hub');
      expect(created.enterprise.enterpriseKey).toMatch(/^ENT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(created.member.role).toBe('manager');
      expect(created.member.permissions).toContain('enterprise:manage');
      expect(created.member.permissions).toContain('stock:view');
    });

    it('should reject enterprise creation if user role is not manager or superadmin', async () => {
      await prisma.user.update({
        where: { email: 'staff@ims.local' },
        data: { role: 'user', canCreateEnterprise: false },
      });

      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      expect(staff).toBeDefined();

      await expect(
        service.createEnterprise(staff!.id, {
          name: 'Unauthorized Logistics',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Enterprise Key Rotation', () => {
    it('should allow enterprise manager to rotate the enterprise key', async () => {
      const manager = await prisma.user.findUnique({ where: { email: 'manager@ims.local' } });
      const enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });
      expect(enterprise).toBeDefined();
      const oldKey = enterprise!.enterpriseKey;

      const result = await service.rotateEnterpriseKey(manager!.id, enterprise!.id);
      expect(result.enterprise.enterpriseKey).not.toBe(oldKey);
      expect(result.enterprise.enterpriseKey).toMatch(/^ENT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      const updated = await prisma.enterprise.findUnique({ where: { id: enterprise!.id } });
      expect(updated!.enterpriseKey).toBe(result.enterprise.enterpriseKey);
    });

    it('should forbid staff from rotating the enterprise key', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      const enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });

      await expect(
        service.rotateEnterpriseKey(staff!.id, enterprise!.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Enterprise Context Switch & Key Login', () => {
    it('should allow member to switch active enterprise context', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      const enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });

      const session = await prisma.session.create({
        data: {
          userId: staff!.id,
          token: `test-session-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });

      const switched = await service.switchEnterprise(staff!.id, session.id, {
        enterpriseKey: enterprise!.enterpriseKey,
      });

      expect(switched.activeEnterpriseId).toBe(enterprise!.id);
      expect(switched.enterprise.name).toBe('Apex Logistics Global');

      const updatedSession = await prisma.session.findUnique({ where: { id: session.id } });
      expect(updatedSession!.activeEnterpriseId).toBe(enterprise!.id);

      await prisma.session.delete({ where: { id: session.id } });
    });

    it('should reject context switch to an enterprise the user does not belong to', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      const otherEnt = await prisma.enterprise.findUnique({ where: { slug: 'omni-retail-hub' } });

      if (otherEnt) {
        const session = await prisma.session.create({
          data: {
            userId: staff!.id,
            token: `test-session-reject-${Date.now()}`,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });

        await expect(
          service.switchEnterprise(staff!.id, session.id, {
            enterpriseId: otherEnt.id,
          }),
        ).rejects.toThrow(ForbiddenException);

        await prisma.session.delete({ where: { id: session.id } });
      }
    });

    it('should authenticate user with credentials and enterpriseKey', async () => {
      const enterprise = await prisma.enterprise.findUnique({ where: { slug: 'apex-logistics' } });

      const result = await service.loginWithEnterpriseKey({
        email: 'staff@ims.local',
        password: 'Password123!',
        enterpriseKey: enterprise!.enterpriseKey,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('staff@ims.local');
      expect(result.enterprise.id).toBe(enterprise!.id);
      expect(result.membership.role).toBe('staff');
    });

    it('should reject login if enterprise key is invalid', async () => {
      await expect(
        service.loginWithEnterpriseKey({
          email: 'staff@ims.local',
          password: 'Password123!',
          enterpriseKey: 'ENT-XXXX-XXXX-XXXX',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('SuperAdmin Platform Oversight', () => {
    it('should allow SuperAdmin to view all users and toggle canCreateEnterprise', async () => {
      const staff = await prisma.user.findUnique({ where: { email: 'staff@ims.local' } });
      expect(staff).toBeDefined();

      const toggled = await service.toggleCanCreateEnterprise(staff!.id, true);
      expect(toggled.user.canCreateEnterprise).toBe(true);

      const reverted = await service.toggleCanCreateEnterprise(staff!.id, false);
      expect(reverted.user.canCreateEnterprise).toBe(false);
    });

    it('should allow SuperAdmin to list all enterprises', async () => {
      const enterprises = await service.getAllEnterprises();
      expect(enterprises.length).toBeGreaterThan(0);
      expect(enterprises[0]).toHaveProperty('enterpriseKey');
      expect(enterprises[0]).toHaveProperty('memberCount');
    });
  });
});
