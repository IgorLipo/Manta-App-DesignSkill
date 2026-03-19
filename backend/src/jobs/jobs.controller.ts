import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JobStatus } from '@prisma/client';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private jobs: JobsService) {}

  // ─── Create job (Admin only) ─────────────────────────
  @Post()
  @Roles('ADMIN')
  createJob(@Req() req: Request & { user: { userId: string } }, @Body() body: any) {
    return this.jobs.createJob(req.user.userId, body);
  }

  // ─── Send owner invite (Admin only) ─────────────────
  @Post(':id/invite')
  @Roles('ADMIN')
  sendInvite(@Param('id') id: string, @Req() req: Request & { user: { userId: string } }) {
    return this.jobs.sendOwnerInvite(id, req.user.userId);
  }

  // ─── Owner submits (Owner only) ──────────────────────
  @Post(':id/submit')
  @Roles('OWNER')
  ownerSubmit(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { latitude: number; longitude: number; photos: string[] },
  ) {
    return this.jobs.ownerSubmit(id, req.user.userId, body);
  }

  // ─── Admin validates ────────────────────────────────
  @Post(':id/validate')
  @Roles('ADMIN')
  validate(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { decision: 'approve' | 'request_more_info' | 'reject'; note?: string },
  ) {
    return this.jobs.validateJob(id, req.user.userId, body.decision, body.note);
  }

  // ─── Admin assigns scaffolder ───────────────────────
  @Post(':id/assign')
  @Roles('ADMIN')
  assign(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { scaffolderId: string },
  ) {
    return this.jobs.assignScaffolder(id, req.user.userId, body.scaffolderId);
  }

  // ─── Scaffolder submits quote ────────────────────────
  @Post(':id/quote')
  @Roles('SCAFFOLDER')
  submitQuote(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { amount: number; notes?: string; proposedDate?: string },
  ) {
    return this.jobs.submitQuote(id, req.user.userId, {
      amount: body.amount,
      notes: body.notes,
      proposedDate: body.proposedDate ? new Date(body.proposedDate) : undefined,
    });
  }

  // ─── Admin reviews quote ────────────────────────────
  @Post('quotes/:quoteId/review')
  @Roles('ADMIN')
  reviewQuote(
    @Param('quoteId') quoteId: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { decision: 'approve' | 'reject' | 'revision'; note?: string },
  ) {
    return this.jobs.reviewQuote(quoteId, req.user.userId, body.decision, body.note);
  }

  // ─── Start scheduling ────────────────────────────────
  @Post(':id/scheduling/start')
  @Roles('ADMIN')
  startScheduling(@Param('id') id: string, @Req() req: Request & { user: { userId: string } }) {
    return this.jobs.startScheduling(id, req.user.userId);
  }

  // ─── List jobs ──────────────────────────────────────
  @Get()
  list(
    @Req() req: Request & { user: { userId: string; role: string } },
    @Query() query: { status?: JobStatus; page?: number; limit?: number; search?: string },
  ) {
    return this.jobs.listJobs(req.user.userId, req.user.role as any, query);
  }

  // ─── Get single job ────────────────────────────────
  @Get(':id')
  get(@Param('id') id: string, @Req() req: Request & { user: { userId: string; role: string } }) {
    return this.jobs.getJob(id, req.user.userId, req.user.role as any);
  }
}
