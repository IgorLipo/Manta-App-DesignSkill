import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  // ==================== Create region (admin) ====================

  async create(data: { name: string; code: string; description?: string }) {
    // Check for duplicate name or code
    const existing = await this.prisma.region.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw new ConflictException('Region with this name or code already exists');
    }

    return this.prisma.region.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
      },
    });
  }

  // ==================== List regions ====================

  async list(filters?: { isActive?: boolean; page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, isActive, search } = filters || {};
    const skip = (page - 1) * limit;

    const where: Prisma.RegionWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.region.findMany({
        where,
        include: {
          scaffolders: {
            include: {
              scaffolder: {
                select: { id: true, companyName: true, firstName: true, lastName: true },
              },
            },
            where: { scaffolder: { isActive: true } },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.region.count({ where }),
    ]);

    return {
      data: data.map((region) => ({
        ...region,
        scaffolderCount: region.scaffolders.length,
        scaffolders: undefined,
      })),
      total,
      page,
      limit,
    };
  }

  // ==================== Get region by ID ====================

  async getById(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        scaffolders: {
          include: {
            scaffolder: {
              include: { user: { select: { email: true } } },
            },
          },
        },
      },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return region;
  }

  // ==================== Update region (admin) ====================

  async update(id: string, data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) {
      throw new NotFoundException('Region not found');
    }

    // Check for duplicate name or code if changing
    if (data.name || data.code) {
      const existing = await this.prisma.region.findFirst({
        where: {
          id: { not: id },
          OR: [
            data.name ? { name: data.name } : {},
            data.code ? { code: data.code.toUpperCase() } : {},
          ],
        },
      });

      if (existing) {
        throw new ConflictException('Region with this name or code already exists');
      }
    }

    return this.prisma.region.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // ==================== Delete region (admin) ====================

  async delete(id: string) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: { scaffolders: true },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    // Check if region has active scaffolders
    if (region.scaffolders.length > 0) {
      throw new ConflictException('Cannot delete region with assigned scaffolders');
    }

    await this.prisma.region.delete({ where: { id } });
    return { success: true };
  }

  // ==================== Get scaffolders in region ====================

  async getScaffolders(regionId: string, filters?: { isActive?: boolean; page?: number; limit?: number }) {
    const { page = 1, limit = 20, isActive = true } = filters || {};
    const skip = (page - 1) * limit;

    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    const where = {
      regions: { some: { regionId } },
      ...(isActive !== undefined && { isActive }),
    };

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
}
