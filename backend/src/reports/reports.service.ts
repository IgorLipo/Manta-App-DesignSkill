import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PdfService } from './pdf.service';
import { JobStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private pdf: PdfService,
  ) {}

  async createOrUpdateReport(jobId: string, engineerId: string, data: any) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    let report = await this.prisma.siteReport.findFirst({ where: { jobId, engineerId } });

    if (!report) {
      report = await this.prisma.siteReport.create({
        data: { jobId, engineerId, status: 'DRAFT', data },
      });
      await this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.SITE_REPORT_PENDING } });
    } else {
      report = await this.prisma.siteReport.update({
        where: { id: report.id },
        data: { data, status: 'IN_PROGRESS' },
      });
      await this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.SITE_REPORT_IN_PROGRESS } });
    }
    return report;
  }

  async submitReport(reportId: string, engineerId: string) {
    const report = await this.prisma.siteReport.findUnique({ where: { id: reportId } });
    if (!report || report.engineerId !== engineerId) throw new NotFoundException('Report not found');

    const pdfKey = await this.pdf.generateSiteReportPdf(reportId);
    const updated = await this.prisma.siteReport.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED', pdfStorageKey: pdfKey, submittedAt: new Date() },
    });

    await this.prisma.job.update({ where: { id: report.jobId }, data: { status: JobStatus.SITE_REPORT_SUBMITTED } });
    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, isActive: true } });
    for (const admin of admins) {
      await this.notifications.send(admin.id, 'SITE_REPORT_SUBMITTED', { jobId: report.jobId });
    }
    return updated;
  }

  async getJobReport(jobId: string) {
    return this.prisma.siteReport.findFirst({ where: { jobId }, include: { engineer: true } });
  }

  async getReportPdf(reportId: string) {
    const report = await this.prisma.siteReport.findUnique({ where: { id: reportId } });
    if (!report?.pdfStorageKey) throw new NotFoundException('PDF not found');
    return { storageKey: report.pdfStorageKey };
  }
}
