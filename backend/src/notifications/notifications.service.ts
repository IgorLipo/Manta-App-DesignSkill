import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface NotificationPayload {
  jobId?: string;
  token?: string;
  note?: string;
  quoteId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async send(userId: string, type: string, payload: NotificationPayload = {}) {
    // Get template
    const template = await this.prisma.notificationTemplate.findUnique({ where: { type } });

    // Build title and body from template or defaults
    const title = template?.titleTemplate || this.defaultTitle(type);
    const body = template?.bodyTemplate || this.defaultBody(type, payload);

    // Save in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        jobId: payload.jobId,
        data: payload as any,
      },
    });

    // Send push notification (FCM stub)
    await this.sendPushNotification(userId, title, body);

    // Send email (stub)
    await this.sendEmailNotification(userId, title, body, template?.emailSubject, template?.emailBody);

    return notification;
  }

  async getInAppNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  private async sendPushNotification(userId: string, title: string, body: string) {
    // FCM stub - integrate with firebase-admin
    console.log(`[PUSH] To ${userId}: ${title} - ${body}`);
  }

  private async sendEmailNotification(userId: string, title: string, body: string, subject?: string, emailBody?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    // Email stub - integrate with SendGrid / SES / Resend
    console.log(`[EMAIL] To ${user.email}: ${subject || title}`);
  }

  private defaultTitle(type: string): string {
    const titles: Record<string, string> = {
      OWNER_INVITE: 'Action Required: Submit Your Property Photos',
      JOB_SUBMITTED: 'New Job Submitted for Review',
      MORE_INFO_REQUESTED: 'More Information Requested',
      ScaffOLDER_ASSIGNED: 'New Job Assigned to You',
      QUOTE_SUBMITTED: 'New Quote Submitted',
      QUOTE_APPROVED: 'Quote Approved',
      QUOTE_REJECTED: 'Quote Rejected',
      QUOTE_REVISION_REQUESTED: 'Quote Revision Requested',
      SCHEDULE_PROPOSED: 'Work Date Proposed',
      SCHEDULE_CONFIRMED: 'Work Date Confirmed',
      WORK_STARTED: 'Scaffold Work Started',
      WORK_COMPLETED: 'Scaffold Work Completed',
      SITE_REPORT_SUBMITTED: 'Site Report Submitted',
    };
    return titles[type] || 'Notification from Solar Ops';
  }

  private defaultBody(type: string, payload: any): string {
    const bodies: Record<string, string> = {
      OWNER_INVITE: 'Please submit your property photos to continue with your solar installation.',
      JOB_SUBMITTED: 'A property owner has submitted their information. Please review.',
      MORE_INFO_REQUESTED: 'The admin has requested more information. Please check your job details.',
      ScaffOLDER_ASSIGNED: 'You have been assigned a new scaffold job. Please review the details.',
      QUOTE_SUBMITTED: 'A scaffolder has submitted a quote for your review.',
      QUOTE_APPROVED: 'Your quote has been approved. Scheduling will begin shortly.',
      QUOTE_REJECTED: 'Your quote has been rejected. Please contact support.',
      QUOTE_REVISION_REQUESTED: 'Your quote needs revision. Please update and resubmit.',
      SCHEDULE_PROPOSED: 'A proposed work date has been submitted for your approval.',
      SCHEDULE_CONFIRMED: 'Your scaffold work date has been confirmed.',
      WORK_STARTED: 'Scaffold work has begun on your property.',
      WORK_COMPLETED: 'Scaffold work has been completed.',
      SITE_REPORT_SUBMITTED: 'A site report has been submitted and is ready for review.',
    };
    return bodies[type] || 'You have a new notification from Solar Ops.';
  }
}
