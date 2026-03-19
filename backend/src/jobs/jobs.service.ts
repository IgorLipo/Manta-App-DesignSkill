import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JobStatus, Role } from '@prisma/client';

// Valid state transitions
const STATE_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.DRAFT]: [JobStatus.AWAITING_OWNER_SUBMISSION],
  [JobStatus.AWAITING_OWNER_SUBMISSION]: [JobStatus.SUBMITTED, JobStatus.DRAFT],
  [JobStatus.SUBMITTED]: [JobStatus.NEEDS_MORE_INFO, JobStatus.VALIDATED],
  [JobStatus.NEEDS_MORE_INFO]: [JobStatus.SUBMITTED],
  [JobStatus.VALIDATED]: [JobStatus.ASSIGNED_TO_SCAFFOLDER, JobStatus.CANCELLED],
  [JobStatus.ASSIGNED_TO_SCAFFOLDER]: [JobStatus.QUOTE_PENDING, JobStatus.NEEDS_MORE_INFO],
  [JobStatus.QUOTE_PENDING]: [JobStatus.QUOTE_SUBMITTED],
  [JobStatus.QUOTE_SUBMITTED]: [JobStatus.QUOTE_REVISION_REQUESTED, JobStatus.QUOTE_APPROVED, JobStatus.QUOTE_REJECTED],
  [JobStatus.QUOTE_REVISION_REQUESTED]: [JobStatus.QUOTE_SUBMITTED],
  [JobStatus.QUOTE_APPROVED]: [JobStatus.SCHEDULING_IN_PROGRESS, JobStatus.QUOTE_REJECTED],
  [JobStatus.QUOTE_REJECTED]: [JobStatus.CANCELLED],
  [JobStatus.SCHEDULING_IN_PROGRESS]: [JobStatus.SCHEDULED, JobStatus.NEEDS_MORE_INFO],
  [JobStatus.SCHEDULED]: [JobStatus.SCAFFOLD_WORK_IN_PROGRESS, JobStatus.SCHEDULING_IN_PROGRESS],
  [JobStatus.SCAFFOLD_WORK_IN_PROGRESS]: [JobStatus.SCAFFOLD_COMPLETE],
  [JobStatus.SCAFFOLD_COMPLETE]: [JobStatus.INSTALLER_ASSIGNED, JobStatus.SITE_REPORT_PENDING],
  [JobStatus.INSTALLER_ASSIGNED]: [JobStatus.SITE_REPORT_PENDING],
  [JobStatus.SITE_REPORT_PENDING]: [JobStatus.SITE_REPORT_IN_PROGRESS],
  [JobStatus.SITE_REPORT_IN_PROGRESS]: [JobStatus.SITE_REPORT_SUBMITTED],
  [JobStatus.SITE_REPORT_SUBMITTED]: [JobStatus.COMPLETED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.CANCELLED]: [],
  [JobStatus.ON_HOLD]: [JobStatus.DRAFT, JobStatus.SCHEDULING_IN_PROGRESS],
};

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── ADMIN: Create job ────────────────────────────────
  async createJob(adminId: string, data: { propertyId: string; addressLine1: string; addressLine2?: string; city: string; postcode: string; ownerEmail: string }) {
    const job = await this.prisma.job.create({
      data: {
        property: {
          create: {
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            postcode: data.postcode,
            owner: {
              create: {
                user: {
                  create: {
                    email: data.ownerEmail.toLowerCase(),
                    passwordHash: '', // Will be set via invite
                    role: Role.OWNER,
                    emailVerified: false,
                  },
                  firstName: '',
                  lastName: '',
                },
              },
            },
          },
        },
        status: JobStatus.DRAFT,
        inviteToken: uuid(),
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: { property: { include: { owner: true } } },
    });

    await this.logAudit(job.id, null, JobStatus.DRAFT, adminId, 'Job created');
    return job;
  }

  // ─── ADMIN: Send invite to owner ────────────────────────
  async sendOwnerInvite(jobId: string, adminId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { property: { include: { owner: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');

    const token = uuid();
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        inviteToken: token,
        inviteSentAt: new Date(),
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: JobStatus.AWAITING_OWNER_SUBMISSION,
      },
    });

    await this.transitionStatus(jobId, JobStatus.AWAITING_OWNER_SUBMISSION, adminId);
    await this.notifications.send(job.property.owner.userId, 'OWNER_INVITE', {
      jobId,
      token,
    });

    return { inviteToken: token };
  }

  // ─── OWNER: Submit photos and location ──────────────────
  async ownerSubmit(jobId: string, ownerId: string, data: { latitude: number; longitude: number; photos: string[] }) {
    const job = await this.getJobWithAccess(jobId, ownerId);
    if (job.status !== JobStatus.AWAITING_OWNER_SUBMISSION) {
      throw new BadRequestException('Job is not awaiting owner submission');
    }

    await this.prisma.property.update({
      where: { id: job.propertyId },
      data: { latitude: data.latitude, longitude: data.longitude },
    });

    // Photos are uploaded separately via Files module, just mark as submitted
    await this.transitionStatus(jobId, JobStatus.SUBMITTED, ownerId);

    // Notify admin
    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, isActive: true } });
    for (const admin of admins) {
      await this.notifications.send(admin.id, 'JOB_SUBMITTED', { jobId });
    }

    return { status: 'submitted' };
  }

  // ─── ADMIN: Validate photos ────────────────────────────
  async validateJob(jobId: string, adminId: string, decision: 'approve' | 'request_more_info' | 'reject', note?: string) {
    if (decision === 'approve') {
      await this.transitionStatus(jobId, JobStatus.VALIDATED, adminId, note);
      return { status: JobStatus.VALIDATED };
    } else if (decision === 'request_more_info') {
      await this.transitionStatus(jobId, JobStatus.NEEDS_MORE_INFO, adminId, note);
      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      const owner = await this.prisma.owner.findFirst({ where: { properties: { some: { id: job!.propertyId } } } });
      if (owner) await this.notifications.send(owner.userId, 'MORE_INFO_REQUESTED', { jobId, note });
      return { status: JobStatus.NEEDS_MORE_INFO };
    } else {
      await this.transitionStatus(jobId, JobStatus.CANCELLED, adminId, note);
      return { status: JobStatus.CANCELLED };
    }
  }

  // ─── ADMIN: Assign scaffolder ─────────────────────────
  async assignScaffolder(jobId: string, adminId: string, scaffolderId: string) {
    await this.transitionStatus(jobId, JobStatus.ASSIGNED_TO_SCAFFOLDER, adminId);

    await this.prisma.jobAssignment.create({
      data: { jobId, scaffolderId, assignedBy: adminId },
    });

    await this.notifications.send(scaffolderId, 'SCAFFOLDER_ASSIGNED', { jobId });

    return { assigned: true };
  }

  // ─── SCAFFOLDER: Submit quote ─────────────────────────
  async submitQuote(jobId: string, scaffolderId: string, data: { amount: number; notes?: string; proposedDate?: Date }) {
    const job = await this.getJobWithAccess(jobId, scaffolderId);
    if (job.status !== JobStatus.ASSIGNED_TO_SCAFFOLDER) {
      throw new BadRequestException('Job is not ready for quotes');
    }

    const quote = await this.prisma.quote.create({
      data: {
        jobId,
        scaffolderId,
        amount: data.amount,
        notes: data.notes,
        proposedDate: data.proposedDate,
        status: 'SUBMITTED',
      },
    });

    await this.transitionStatus(jobId, JobStatus.QUOTE_SUBMITTED, scaffolderId);

    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, isActive: true } });
    for (const admin of admins) {
      await this.notifications.send(admin.id, 'QUOTE_SUBMITTED', { jobId, quoteId: quote.id });
    }

    return quote;
  }

  // ─── ADMIN: Review quote ──────────────────────────────
  async reviewQuote(quoteId: string, adminId: string, decision: 'approve' | 'reject' | 'revision', note?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { job: true, scaffolder: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    if (decision === 'approve') {
      await this.prisma.quote.update({ where: { id: quoteId }, data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() } });
      await this.transitionStatus(quote.jobId, JobStatus.QUOTE_APPROVED, adminId, note);
      await this.notifications.send(quote.scaffolder.userId, 'QUOTE_APPROVED', { jobId: quote.jobId, quoteId });
    } else if (decision === 'reject') {
      await this.prisma.quote.update({ where: { id: quoteId }, data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date() } });
      await this.transitionStatus(quote.jobId, JobStatus.QUOTE_REJECTED, adminId, note);
      await this.notifications.send(quote.scaffolder.userId, 'QUOTE_REJECTED', { jobId: quote.jobId });
    } else {
      await this.prisma.quote.update({ where: { id: quoteId }, data: { status: 'REVISION_REQUESTED', revisionNote: note } });
      await this.transitionStatus(quote.jobId, JobStatus.QUOTE_REVISION_REQUESTED, adminId, note);
      await this.notifications.send(quote.scaffolder.userId, 'QUOTE_REVISION_REQUESTED', { jobId: quote.jobId, note });
    }

    return { success: true };
  }

  // ─── ADMIN: Start scheduling ──────────────────────────
  async startScheduling(jobId: string, adminId: string) {
    await this.transitionStatus(jobId, JobStatus.SCHEDULING_IN_PROGRESS, adminId);
    return { status: JobStatus.SCHEDULING_IN_PROGRESS };
  }

  // ─── List jobs (role-aware) ──────────────────────────
  async listJobs(userId: string, role: Role, filters: { status?: JobStatus; page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.property = {
        OR: [
          { addressLine1: { contains: search, mode: 'insensitive' } },
          { postcode: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({ where: { userId } });
      if (!owner) return { data: [], total: 0, page, limit };
      where.propertyId = { in: (await this.prisma.property.findMany({ where: { ownerId: owner.id }, select: { id: true } })).map(p => p.id) };
    } else if (role === Role.SCAFFOLDER) {
      const assignment = await this.prisma.jobAssignment.findFirst({ where: { scaffolderId: userId, isActive: true } });
      if (!assignment) return { data: [], total: 0, page, limit };
      // Scaffolders see jobs assigned to them
      where.assignments = { some: { scaffolderId: userId, isActive: true } };
    }
    // ADMIN sees all

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          property: true,
          assignments: { include: { scaffolder: true } },
          photos: { where: { reviewStatus: 'PENDING' }, take: 5 },
          quotes: { orderBy: { submittedAt: 'desc' }, take: 1 },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Get single job ──────────────────────────────────
  async getJob(jobId: string, userId: string, role: Role) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        property: { include: { owner: { include: { user: { select: { email: true } } } } } },
        assignments: { include: { scaffolder: true }, where: { isActive: true } },
        photos: { include: { job: false } },
        quotes: { include: { scaffolder: true } },
        schedules: { orderBy: { proposedDate: 'desc' } },
        siteReports: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    // ACL check
    if (role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({ where: { userId } });
      if (job.property.ownerId !== owner?.id) throw new ForbiddenException();
    } else if (role === Role.SCAFFOLDER) {
      const assigned = job.assignments.some(a => a.scaffolder.userId === userId);
      if (!assigned) throw new ForbiddenException();
    }

    return job;
  }

  // ─── Transition status with validation ───────────────
  private async transitionStatus(jobId: string, newStatus: JobStatus, changedBy: string, note?: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const allowed = STATE_TRANSITIONS[job.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${job.status} to ${newStatus}`);
    }

    const oldStatus = job.status;
    await this.prisma.job.update({ where: { id: jobId }, data: { status: newStatus } });
    await this.prisma.jobStatusHistory.create({
      data: { jobId, fromStatus: oldStatus, toStatus: newStatus, changedBy, note },
    });
  }

  private async getJobWithAccess(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { property: { include: { owner: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private async logAudit(entityId: string, fromStatus: JobStatus | null, toStatus: JobStatus, userId: string, note?: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'JOB_STATUS_CHANGED',
        entityType: 'Job',
        entityId,
        changes: { from: fromStatus, to: toStatus, note },
      },
    });
  }
}
