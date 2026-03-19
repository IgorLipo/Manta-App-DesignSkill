import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post(':jobId/report')
  @Roles('ENGINEER')
  saveReport(
    @Param('jobId') jobId: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() data: any,
  ) {
    return this.reports.createOrUpdateReport(jobId, req.user.userId, data);
  }

  @Post('reports/:reportId/submit')
  @Roles('ENGINEER')
  submitReport(@Param('reportId') reportId: string, @Req() req: Request & { user: { userId: string } }) {
    return this.reports.submitReport(reportId, req.user.userId);
  }

  @Get(':jobId/report')
  @Roles('ADMIN', 'ENGINEER')
  getReport(@Param('jobId') jobId: string) {
    return this.reports.getJobReport(jobId);
  }

  @Get('reports/:reportId/pdf')
  @Roles('ADMIN')
  getPdf(@Param('reportId') reportId: string) {
    return this.reports.getReportPdf(reportId);
  }
}
