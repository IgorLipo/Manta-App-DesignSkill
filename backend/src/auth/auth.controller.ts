import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: { email: string; password: string; firstName: string; lastName: string; role?: string }) {
    return this.authService.register(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken: string }, @Req() req: any) {
    // Extract userId from the authenticated request if available
    const userId = req.user?.userId;
    if (userId) {
      return this.authService.logout(userId);
    }
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return req.user;
  }

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

  @Post('admin/assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async assignRole(@Body() body: { clerkId: string; role: Role }) {
    const user = await this.authService.updateUserRole(body.clerkId, body.role);
    return { user };
  }
}
