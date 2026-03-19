import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobAclGuard } from './guards/job-acl.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesModule } from '../files/files.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [NotificationsModule, FilesModule, ReportsModule],
  controllers: [JobsController],
  providers: [JobsService, JobAclGuard],
  exports: [JobsService],
})
export class JobsModule {}
