import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApplyManagerDto } from './dto/apply-manager.dto.js';
import { ReviewApplicationDto } from './dto/review-application.dto.js';

@Injectable()
export class ManagerApplicationService {
  private readonly logger = new Logger(ManagerApplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * User: Submit a new Managerial Role Application (requires SuperAdmin approval).
   */
  async createApplication(userId: string, dto: ApplyManagerDto) {
    if (!dto.enterpriseName?.trim() || !dto.industry?.trim() || !dto.reason?.trim()) {
      throw new BadRequestException('Enterprise name, industry, and reason are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, canCreateEnterprise: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'manager' || user.role === 'superadmin') {
      throw new ConflictException('You already have Manager or SuperAdmin privileges.');
    }

    // Check for existing pending application
    const existingPending = await this.prisma.managerApplication.findFirst({
      where: { userId, status: 'pending' },
    });

    if (existingPending) {
      throw new ConflictException(
        'You already have an application under review. Please wait for SuperAdmin approval.',
      );
    }

    const application = await this.prisma.managerApplication.create({
      data: {
        userId,
        enterpriseName: dto.enterpriseName.trim(),
        industry: dto.industry.trim(),
        businessScale: dto.businessScale?.trim() || 'Small to Medium Business',
        reason: dto.reason.trim(),
        status: 'pending',
      },
    });

    this.logger.log(`User ${user.email} submitted managerial application ${application.id}`);

    return {
      message: 'Managerial role application submitted successfully. Pending SuperAdmin review.',
      application,
    };
  }

  /**
   * User: Get current application status
   */
  async getMyApplication(userId: string) {
    const application = await this.prisma.managerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return application;
  }

  /**
   * SuperAdmin: List all applications
   */
  async getAllApplications() {
    const applications = await this.prisma.managerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            canCreateEnterprise: true,
          },
        },
      },
    });

    return applications;
  }

  /**
   * SuperAdmin: Approve or Reject application.
   * On approve: promotes user role to 'manager' and sets canCreateEnterprise = true.
   * On reject: keeps user role as 'user'.
   */
  async reviewApplication(applicationId: string, reviewerId: string, dto: ReviewApplicationDto) {
    if (!['approved', 'rejected'].includes(dto.status)) {
      throw new BadRequestException('Status must be either "approved" or "rejected"');
    }

    const app = await this.prisma.managerApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.status === 'approved') {
        // Promote user to manager role
        await tx.user.update({
          where: { id: app.userId },
          data: { role: 'manager', canCreateEnterprise: true },
        });
      }

      const updatedApp = await tx.managerApplication.update({
        where: { id: applicationId },
        data: {
          status: dto.status,
          reviewerNotes: dto.reviewerNotes || null,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, canCreateEnterprise: true },
          },
        },
      });

      return updatedApp;
    });

    this.logger.log(
      `Application ${applicationId} for ${app.user.email} ${dto.status} by reviewer ${reviewerId}`,
    );

    return {
      message: `Application ${dto.status} successfully`,
      application: result,
    };
  }
}
