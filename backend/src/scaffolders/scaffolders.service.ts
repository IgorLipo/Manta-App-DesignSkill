import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScaffoldersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ==================== ADMIN: Create scaffolder ====================

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyName?: string;
    regionIds?: string[];
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and scaffolder profile in transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          role: Role.SCAFFOLDER,
          emailVerified: true, // Admin creates verified users
          isActive: true,
        },
      });

      const scaffolder = await tx.scaffolder.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          companyName: data.companyName,
          isActive: true,
          ...(data.regionIds && {
            regions: {
              create: data.regionIds.map((regionId) => ({ regionId })),
            },
          }),
        },
        include: {
          regions: { include: { region: true } },
          user: { select: { email: true } },
        },
      });

      return scaffolder;
    });
  }

  // ==================== List scaffolders ====================

  async list(filters?: {
    regionId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 20, regionId, isActive, search } = filters || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ScaffolderWhereInput = {};

    if (regionId) {
      where.regions = { some: { regionId } };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.scaffolder.findMany({
        where,
        include: {
          user: { select: { email: true } },
          regions: { include: { region: true } },
        },
        skip,
        take: limit,
        orderBy: { companyName: 'asc' },
      }),
      this.prisma.scaffolder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ==================== Get scaffolder by ID ====================

  async getById(id: string) {
    const scaffolder = await this.prisma.scaffolder.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, isActive: true, emailVerified: true } },
        regions: { include: { region: true } },
        assignments: {
          where: { isActive: true },
          include: { job: { include: { property: true } } },
        },
      },
    });

    if (!scaffolder) {
      throw new NotFoundException('Scaffolder not found');
    }

    return scaffolder;
  }

  // ==================== Update scaffolder (admin) ====================

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      companyName?: string;
      isActive?: boolean;
      regionIds?: string[];
    },
  ) {
    const scaffolder = await this.prisma.scaffolder.findUnique({ where: { id } });
    if (!scaffolder) {
      throw new NotFoundException('Scaffolder not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update user active status if needed
      if (data.isActive !== undefined) {
        await tx.user.update({
          where: { id: scaffolder.userId },
          data: { isActive: data.isActive },
        });
      }

      // Update region associations if provided
      if (data.regionIds !== undefined) {
        // Remove existing associations
        await tx.scaffolderRegion.deleteMany({
          where: { scaffolderId: id },
        });

        // Add new associations
        if (data.regionIds.length > 0) {
          await tx.scaffolderRegion.createMany({
            data: data.regionIds.map((regionId) => ({
              scaffolderId: id,
              regionId,
            })),
          });
        }
      }

      // Update scaffolder profile
      return tx.scaffolder.update({
        where: { id },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.companyName !== undefined && { companyName: data.companyName }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          user: { select: { email: true, isActive: true } },
          regions: { include: { region: true } },
        },
      });
    });
  }

  // ==================== Deactivate scaffolder (admin) ====================

  async deactivate(id: string) {
    const scaffolder = await this.prisma.scaffolder.findUnique({ where: { id } });
    if (!scaffolder) {
      throw new NotFoundException('Scaffolder not found');
    }

    await this.prisma.$transaction([
      this.prisma.scaffolder.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.user.update({
        where: { id: scaffolder.userId },
        data: { isActive: false },
      }),
    ]);

    return { success: true };
  }

  // ==================== Reactivate scaffolder (admin) ====================

  async reactivate(id: string) {
    const scaffolder = await this.prisma.scaffolder.findUnique({ where: { id } });
    if (!scaffolder) {
      throw new NotFoundException('Scaffolder not found');
    }

    await this.prisma.$transaction([
      this.prisma.scaffolder.update({
        where: { id },
        data: { isActive: true },
      }),
      this.prisma.user.update({
        where: { id: scaffolder.userId },
        data: { isActive: true },
      }),
    ]);

    return { success: true };
  }

  // ==================== Get assigned jobs for scaffolder ====================

  async getAssignedJobs(scaffolderId: string, filters?: { status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, status } = filters || {};
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      assignments: {
        some: {
          scaffolderId,
          isActive: true,
        },
      },
    };

    if (status) {
      where.status = status as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          property: true,
          assignments: { where: { scaffolderId, isActive: true }, include: { scaffolder: true } },
          quotes: { where: { scaffolderId }, orderBy: { submittedAt: 'desc' }, take: 1 },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ==================== Get scaffolder by user ID ====================

  async getByUserId(userId: string) {
    const scaffolder = await this.prisma.scaffolder.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true } },
        regions: { include: { region: true } },
      },
    });

    if (!scaffolder) {
      throw new NotFoundException('Scaffolder profile not found');
    }

    return scaffolder;
  }
}
