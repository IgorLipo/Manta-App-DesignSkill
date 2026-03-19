import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk/clerk.service';
import { ClerkStrategy } from './clerk/clerk.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, ClerkService, ClerkStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, ClerkService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
