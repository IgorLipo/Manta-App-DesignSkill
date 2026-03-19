import { Controller, Post, Body, Get, Patch, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateProfileDto,
  ChangePasswordDto,
  MagicLinkDto,
  MagicLinkVerifyDto,
} from './dtos';

interface RequestWithUser extends Request {
  user: { userId: string; role: string };
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // ==================== Register ====================

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // ==================== Login ====================

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login({ ...dto, userAgent: req.headers['user-agent'] });
  }

  // ==================== Magic Link ====================

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  sendMagicLink(@Body() dto: MagicLinkDto) {
    return this.auth.sendMagicLink(dto);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  verifyMagicLink(@Body() dto: MagicLinkVerifyDto) {
    return this.auth.verifyMagicLink(dto.token);
  }

  // ==================== Refresh Token ====================

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refreshTokens(dto);
  }

  // ==================== Logout ====================

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  // ==================== Forgot Password ====================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  // ==================== Reset Password ====================

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // ==================== Verify Email ====================

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  // ==================== Get Profile ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestWithUser) {
    return this.auth.getProfile(req.user.userId);
  }

  // ==================== Update Profile ====================

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.userId, dto);
  }

  // ==================== Change Password ====================

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }
}
