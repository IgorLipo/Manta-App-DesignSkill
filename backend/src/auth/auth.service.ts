import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role || Role.OWNER,
        emailVerified: false,
      },
    });

    // Create email verification token
    const token = uuid();
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Send verification email (stub - integrate with email provider)
    await this.sendVerificationEmail(user.email, token);

    // Create role-specific profile
    if (dto.role === Role.OWNER) {
      await this.prisma.owner.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    return { userId: user.id, message: 'Registration successful' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.role);
    await this.saveSession(user.id, tokens.refreshToken, dto.userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.delete({ where: { id: session.id } });
    const tokens = await this.generateTokens(session.userId, session.user.role);
    await this.saveSession(session.userId, tokens.refreshToken, session.userAgent || undefined);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { refreshToken },
    });
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If the email exists, a reset link was sent' };

    const token = uuid();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    // Send reset email (stub)
    console.log(`[EMAIL] Password reset for ${user.email}: ${token}`);
    return { message: 'If the email exists, a reset link was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
    });
    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });
    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({ where: { userId: reset.userId } });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token: dto.token },
    });
    if (!verification || verification.expiresAt < new Date() || verification.verifiedAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    });
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    return { message: 'Email verified successfully' };
  }

  private async generateTokens(userId: string, role: Role) {
    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, refreshToken: string, userAgent?: string) {
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async sendVerificationEmail(email: string, token: string) {
    const url = `${this.config.get('APP_URL')}/auth/verify-email?token=${token}`;
    console.log(`[EMAIL] Verify email for ${email}: ${url}`);
  }
}
