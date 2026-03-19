import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateUser(clerkUser: any) {
    const { id: clerkId, emailAddresses, firstName, lastName } = clerkUser;
    const email = emailAddresses[0]?.emailAddress;
    let user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name: [firstName, lastName].filter(Boolean).join(' '),
          role: Role.OWNER,
        },
      });
    }
    return user;
  }

  async findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({ where: { clerkId } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateRole(clerkId: string, role: Role) {
    return this.prisma.user.update({
      where: { clerkId },
      data: { role },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }
}
