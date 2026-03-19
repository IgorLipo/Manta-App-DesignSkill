import { Injectable } from '@nestjs/common';
import { ClerkService } from './clerk/clerk.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private clerkService: ClerkService,
    private usersService: UsersService,
  ) {}

  async validateToken(token: string) {
    const clerkUser = await this.clerkService.verifyToken(token);
    if (!clerkUser) return null;
    return this.usersService.findOrCreateUser(clerkUser);
  }

  async getUserFromClerkId(clerkId: string) {
    return this.usersService.findByClerkId(clerkId);
  }

  async updateUserRole(clerkId: string, role: Role) {
    return this.usersService.updateRole(clerkId, role);
  }
}
