import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req: Request & { user: { userId: string } }) {
    return this.users.findById(req.user.userId);
  }

  @Patch('me')
  updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.users.updateProfile(req.user.userId, body);
  }

  @Get('scaffolders')
  getScaffolders(@Body() filters: { regionId?: string; isActive?: boolean }) {
    return this.users.getScaffolders(filters);
  }
}
