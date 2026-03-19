import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../files/s3.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PdfService {
  constructor(
    private config: ConfigService,
    private s3: S3Service,
    private prisma: PrismaService,
  ) {}

  async generateSiteReportPdf(reportId: string): Promise<string> {
    const report = await this.prisma.siteReport.findUnique({
      where: { id: reportId },
      include: {
        job: { include: { property: { include: { owner: true } } } },
        engineer: true,
      },
    });
    if (!report) throw new Error('Report not found');

    const html = this.buildReportHtml(report);
    const pdfBuffer = await this.renderHtmlToPdf(html);

    const key = this.s3.generateKey(`reports/${report.jobId}`, `site-report-${reportId}.pdf`);
    await this.s3.upload(key, pdfBuffer, 'application/pdf', { 'report-id': reportId, 'job-id': report.jobId });
    return key;
  }

  private buildReportHtml(report: any): string {
    const { job, engineer, data, submittedAt } = report;
    const { property } = job;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Site Report - ${property.addressLine1}</title></head><body><h1>Solar Installation Site Report</h1><p>Property: ${property.addressLine1}, ${property.city}, ${property.postcode}</p><p>Owner: ${property.owner.firstName} ${property.owner.lastName}</p><p>Engineer: ${engineer.firstName} ${engineer.lastName}</p><p>Job Ref: ${job.id.substring(0, 8).toUpperCase()}</p><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    // In production: use Puppeteer or @react-pdf/renderer
    return Buffer.from(html, 'utf-8');
  }
}
