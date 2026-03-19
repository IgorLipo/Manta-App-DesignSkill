import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('clerk/webhook')
  async clerkWebhook(@Body() body: any) {
    // Handle Clerk webhook - user creation/updates
    return { received: true };
  }

  @Post('clerk/callback')
  @HttpCode(HttpStatus.OK)
  async clerkCallback(@Body() body: { token: string }) {
    const user = await this.authService.validateToken(body.token);
    if (!user) throw new Error('Invalid token');
    return { user, token: body.token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return req.user;
  }

  @Post('admin/assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignRole(@Body() body: { clerkId: string; role: Role }) {
    const user = await this.authService.updateUserRole(body.clerkId, body.role);
    return { user };
  }
}
