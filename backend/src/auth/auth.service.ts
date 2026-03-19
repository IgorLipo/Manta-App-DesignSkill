import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'jwt-secret' });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      return user;
    } catch {
      return null;
    }
  }

  async updateUserRole(clerkId: string, role: string) {
    const user = await this.prisma.user.update({
      where: { clerkId },
      data: { role: role as any },
    });
    return user;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; role?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.prisma.user.create({
      data: { email: data.email, role: (data.role as any) || 'OWNER', clerkId: `local-${data.email}` },
    });
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' });
      const stored = await this.prisma.refreshToken.findFirst({ where: { userId: payload.sub, revokedAt: null } });
      if (!stored) throw new UnauthorizedException('Token revoked');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return await this.generateTokens(user.id, user.email, user.role);
    } catch { throw new UnauthorizedException('Invalid refresh token'); }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.sanitize(user) : null;
  }

  async forgotPassword(email: string) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret' });
      await this.prisma.user.update({ where: { id: payload.sub }, data: { passwordHash: password } });
      return { message: 'Password reset successful' };
    } catch { throw new UnauthorizedException('Invalid or expired token'); }
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET || 'jwt-secret', expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret', expiresIn: '7d' }),
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: token, expiresAt: new Date(Date.now() + 7 * 86400000) } });
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user; return rest;
  }
}
