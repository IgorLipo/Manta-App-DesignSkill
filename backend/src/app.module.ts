import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { QuotesModule } from './quotes/quotes.module';
import { PhotosModule } from './photos/photos.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { GdprModule } from './gdpr/gdpr.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    QuotesModule,
    PhotosModule,
    SchedulingModule,
    NotificationsModule,
    ReportsModule,
    AuditModule,
    StorageModule,
    GdprModule,
  ],
})
export class AppModule {}
