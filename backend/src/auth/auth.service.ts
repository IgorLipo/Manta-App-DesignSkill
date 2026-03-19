import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, JobStatus } from '@prisma/client';
import * as crypto from 'crypto';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  UpdateProfileDto,
  MagicLinkDto,
} from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ==================== Register ====================

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user with role-specific profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: dto.role || Role.OWNER,
          emailVerified: false,
          isActive: true,
        },
      });

      // Create role-specific profile
      if (dto.role === Role.OWNER || !dto.role) {
        await tx.owner.create({
          data: {
            userId: user.id,
            firstName: dto.firstName || '',
            lastName: dto.lastName || '',
            phone: dto.phone,
          },
        });
      } else if (dto.role === Role.SCAFFOLDER) {
        await tx.scaffolder.create({
          data: {
            userId: user.id,
            firstName: dto.firstName || '',
            lastName: dto.lastName || '',
            phone: dto.phone,
            companyName: dto.companyName,
            isActive: true,
          },
        });
      } else if (dto.role === Role.ENGINEER) {
        await tx.engineer.create({
          data: {
            userId: user.id,
            firstName: dto.firstName || '',
            lastName: dto.lastName || '',
            phone: dto.phone,
            isActive: true,
          },
        });
      }

      return user;
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

    // Send verification email
    await this.sendVerificationEmail(user.email, token);

    return { userId: user.id, message: 'Registration successful. Please verify your email.' };
  }

  // ==================== Login ====================

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        owner: true,
        scaffolder: true,
        engineer: true,
      },
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

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    // Hash refresh token and save session
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    await this.saveSession(user.id, refreshTokenHash, dto.userAgent);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        firstName: user.owner?.firstName || user.scaffolder?.firstName || user.engineer?.firstName || '',
        lastName: user.owner?.lastName || user.scaffolder?.lastName || user.engineer?.lastName || '',
      },
    };
  }

  // ==================== Magic Link Login ====================

  async sendMagicLink(dto: MagicLinkDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a magic link was sent' };
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate magic link token
    const magicToken = uuid();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link token (we can use passwordReset table for this)
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: magicToken,
        expiresAt,
      },
    });

    // Send magic link via email
    const magicLinkUrl = `${this.config.get('APP_URL')}/auth/magic-link/${magicToken}`;
    console.log(`[MAGIC LINK] For ${user.email}: ${magicLinkUrl}`);

    // In production, send actual email
    await this.notifications.send(user.id, 'MAGIC_LINK_SENT', {
      magicLink: magicLinkUrl,
    });

    return { message: 'If the email exists, a magic link was sent' };
  }

  // ==================== Verify Magic Link ====================

  async verifyMagicLink(token: string) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: reset.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or deactivated');
    }

    // Mark magic link as used
    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    // Hash refresh token and save session
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    await this.saveSession(user.id, refreshTokenHash);

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

  // ==================== Refresh Tokens ====================

  async refreshTokens(dto: RefreshTokenDto) {
    const refreshTokenHash = this.hashToken(dto.refreshToken);

    const session = await this.prisma.session.findFirst({
      where: { refreshToken: refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if user is still active
    if (!session.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Delete old session (rotation)
    await this.prisma.session.delete({ where: { id: session.id } });

    // Generate new tokens
    const tokens = await this.generateTokens(session.userId, session.user.role);

    // Save new session
    const newRefreshTokenHash = this.hashToken(tokens.refreshToken);
    await this.saveSession(session.userId, newRefreshTokenHash, session.userAgent || undefined);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ==================== Logout ====================

  async logout(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.prisma.session.deleteMany({
      where: { refreshToken: refreshTokenHash },
    });
    return { success: true };
  }

  // ==================== Forgot Password ====================

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link was sent' };
    }

    const token = uuid();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    // Send reset email
    const resetUrl = `${this.config.get('APP_URL')}/auth/reset-password?token=${token}`;
    console.log(`[PASSWORD RESET] For ${user.email}: ${resetUrl}`);

    return { message: 'If the email exists, a reset link was sent' };
  }

  // ==================== Reset Password ====================

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
    });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all sessions
      this.prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);

    return { message: 'Password reset successful' };
  }

  // ==================== Verify Email ====================

  async verifyEmail(dto: VerifyEmailDto) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token: dto.token },
    });

    if (!verification || verification.expiresAt < new Date() || verification.verifiedAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  // ==================== Get Profile ====================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        owner: true,
        scaffolder: {
          include: { regions: { include: { region: true } } },
        },
        engineer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileData: any = {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    // Add role-specific profile data
    if (user.role === Role.OWNER && user.owner) {
      profileData.firstName = user.owner.firstName;
      profileData.lastName = user.owner.lastName;
      profileData.phone = user.owner.phone;
    } else if (user.role === Role.SCAFFOLDER && user.scaffolder) {
      profileData.firstName = user.scaffolder.firstName;
      profileData.lastName = user.scaffolder.lastName;
      profileData.phone = user.scaffolder.phone;
      profileData.companyName = user.scaffolder.companyName;
      profileData.isActiveScaffolder = user.scaffolder.isActive;
      profileData.regions = user.scaffolder.regions.map((r) => r.region);
    } else if (user.role === Role.ENGINEER && user.engineer) {
      profileData.firstName = user.engineer.firstName;
      profileData.lastName = user.engineer.lastName;
      profileData.phone = user.engineer.phone;
      profileData.isActiveEngineer = user.engineer.isActive;
    }

    return profileData;
  }

  // ==================== Update Profile ====================

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        owner: true,
        scaffolder: true,
        engineer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      if (user.role === Role.OWNER && user.owner) {
        await tx.owner.update({
          where: { userId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
          },
        });
      } else if (user.role === Role.SCAFFOLDER && user.scaffolder) {
        await tx.scaffolder.update({
          where: { userId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
          },
        });
      } else if (user.role === Role.ENGINEER && user.engineer) {
        await tx.engineer.update({
          where: { userId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName }),
            ...(dto.lastName && { lastName: dto.lastName }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
          },
        });
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        entityType: 'User',
        entityId: userId,
        changes: dto,
      },
    });

    return this.getProfile(userId);
  }

  // ==================== Change Password ====================

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Invalidate all sessions except current
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'User',
        entityId: userId,
      },
    });

    return { message: 'Password changed successfully' };
  }

  // ==================== Private Helpers ====================

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

  private async saveSession(userId: string, refreshTokenHash: string, userAgent?: string) {
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: refreshTokenHash,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendVerificationEmail(email: string, token: string) {
    const url = `${this.config.get('APP_URL')}/auth/verify-email?token=${token}`;
    console.log(`[EMAIL] Verify email for ${email}: ${url}`);
    // In production, use actual email service
  }
}
