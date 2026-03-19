import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JobStatus, QuoteStatus, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ==================== SCAFFOLDER: Submit quote ====================

  async submitQuote(
    jobId: string,
    scaffolderId: string,
    data: {
      amount: number;
      notes?: string;
      proposedDate?: Date;
    },
  ) {
    // Verify job exists and is in correct state
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignments: {
          where: { scaffolderId, isActive: true },
          include: { scaffolder: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if scaffolder is assigned to this job
    const assignment = job.assignments[0];
    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    // Check job status - can submit quote when assigned or in QUOTE_PENDING state
    const allowedStatuses = [JobStatus.ASSIGNED_TO_SCAFFOLDER, JobStatus.QUOTE_PENDING];
    if (!allowedStatuses.includes(job.status)) {
      throw new BadRequestException('Job is not ready for quotes');
    }

    // Check if quote already exists for this scaffolder on this job
    const existingQuote = await this.prisma.quote.findFirst({
      where: {
        jobId,
        scaffolderId: assignment.scaffolderId,
      },
    });

    let quote;

    if (existingQuote) {
      // Update existing quote (new revision)
      quote = await this.prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          amount: data.amount,
          notes: data.notes,
          proposedDate: data.proposedDate,
          status: QuoteStatus.SUBMITTED,
          submittedAt: new Date(),
          version: { increment: 1 },
        },
      });
    } else {
      // Create new quote
      quote = await this.prisma.quote.create({
        data: {
          jobId,
          scaffolderId: assignment.scaffolderId,
          amount: data.amount,
          notes: data.notes,
          proposedDate: data.proposedDate,
          status: QuoteStatus.SUBMITTED,
        },
      });
    }

    // Transition job status
    await this.transitionJobStatus(jobId, JobStatus.QUOTE_SUBMITTED, scaffolderId);

    // Notify admins
    await this.notifyAdmins('QUOTE_SUBMITTED', jobId, {
      quoteId: quote.id,
      amount: data.amount,
      scaffolderName: `${assignment.scaffolder.firstName} ${assignment.scaffolder.lastName}`,
    });

    return quote;
  }

  // ==================== SCAFFOLDER: Submit revision ====================

  async submitRevision(
    quoteId: string,
    scaffolderId: string,
    data: {
      amount: number;
      notes?: string;
      proposedDate?: Date;
    },
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { job: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.scaffolderId !== scaffolderId) {
      throw new ForbiddenException('You can only modify your own quotes');
    }

    if (quote.status !== QuoteStatus.REVISION_REQUESTED) {
      throw new BadRequestException('Quote is not awaiting revision');
    }

    // Update quote with revision
    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        amount: data.amount,
        notes: data.notes,
        proposedDate: data.proposedDate,
        status: QuoteStatus.SUBMITTED,
        submittedAt: new Date(),
        revisionNote: null,
        version: { increment: 1 },
      },
    });

    // Transition job back to QUOTE_SUBMITTED
    await this.transitionJobStatus(quote.jobId, JobStatus.QUOTE_SUBMITTED, scaffolderId);

    // Notify admins
    await this.notifyAdmins('QUOTE_REVISED', quote.jobId, {
      quoteId: quote.id,
      amount: data.amount,
    });

    return updatedQuote;
  }

  // ==================== ADMIN: Review quote ====================

  async reviewQuote(
    quoteId: string,
    adminId: string,
    decision: 'approve' | 'reject' | 'revision',
    note?: string,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        job: true,
        scaffolder: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    let newJobStatus: JobStatus;
    let notificationType: string;

    switch (decision) {
      case 'approve':
        await this.prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: QuoteStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        });
        newJobStatus = JobStatus.QUOTE_APPROVED;
        notificationType = 'QUOTE_APPROVED';
        break;

      case 'reject':
        await this.prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: QuoteStatus.REJECTED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
            revisionNote: note,
          },
        });
        newJobStatus = JobStatus.QUOTE_REJECTED;
        notificationType = 'QUOTE_REJECTED';
        break;

      case 'revision':
        await this.prisma.quote.update({
          where: { id: quoteId },
          data: {
            status: QuoteStatus.REVISION_REQUESTED,
            revisionNote: note,
          },
        });
        newJobStatus = JobStatus.QUOTE_REVISION_REQUESTED;
        notificationType = 'QUOTE_REVISION_REQUESTED';
        break;

      default:
        throw new BadRequestException('Invalid decision');
    }

    // Transition job status
    await this.transitionJobStatus(quote.jobId, newJobStatus, adminId);

    // Notify scaffolder
    await this.notifications.send(quote.scaffolder.userId, notificationType, {
      jobId: quote.jobId,
      quoteId: quote.id,
      note,
    });

    return { success: true, quoteId, decision };
  }

  // ==================== Get quotes for a job ====================

  async getJobQuotes(jobId: string, userId: string, role: Role) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignments: role === Role.SCAFFOLDER ? { where: { scaffolder: { userId } } } : false,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Object-level access control
    if (role === Role.SCAFFOLDER) {
      const hasAssignment = job.assignments && job.assignments.length > 0;
      if (!hasAssignment) {
        throw new ForbiddenException('You do not have access to this job');
      }
    }

    return this.prisma.quote.findMany({
      where: { jobId },
      include: {
        scaffolder: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ==================== Get single quote ====================

  async getQuote(quoteId: string, userId: string, role: Role) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        job: {
          include: {
            assignments: role === Role.SCAFFOLDER ? { where: { scaffolder: { userId } } } : true,
          },
        },
        scaffolder: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // ACL check
    if (role === Role.SCAFFOLDER && quote.scaffolder.userId !== userId) {
      throw new ForbiddenException('You can only view your own quotes');
    }

    return quote;
  }

  // ==================== List quotes (admin) ====================

  async listQuotes(filters: {
    status?: QuoteStatus;
    jobId?: string;
    scaffolderId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, status, jobId, scaffolderId } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (scaffolderId) where.scaffolderId = scaffolderId;

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          job: { include: { property: true } },
          scaffolder: { include: { user: { select: { email: true } } } },
        },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ==================== Private helpers ====================

  private async transitionJobStatus(jobId: string, newStatus: JobStatus, changedBy: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const oldStatus = job.status;

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });

    await this.prisma.jobStatusHistory.create({
      data: {
        jobId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        changedBy,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: changedBy,
        action: 'JOB_STATUS_CHANGED',
        entityType: 'Job',
        entityId: jobId,
        changes: { from: oldStatus, to: newStatus },
      },
    });
  }

  private async notifyAdmins(type: string, jobId: string, data: Record<string, any>) {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
    });

    for (const admin of admins) {
      await this.notifications.send(admin.id, type, { jobId, ...data });
    }
  }
}
