import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, emailVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      if (user.role === Role.OWNER) {
        await tx.owner.update({
          where: { userId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
      } else if (user.role === Role.SCAFFOLDER) {
        await tx.scaffolder.update({
          where: { userId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        });
      }
      return this.findById(userId);
    });
  }

  async deactivateUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { success: true };
  }

  async getScaffolders(filters?: { regionId?: string; isActive?: boolean }) {
    const where: any = { isActive: filters?.isActive ?? true };
    if (filters?.regionId) {
      where.regions = { some: { regionId: filters.regionId } };
    }
    return this.prisma.scaffolder.findMany({
      where,
      include: { regions: { include: { region: true } }, user: { select: { email: true } } },
    });
  }

  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true, email: true },
    });
  }
}
