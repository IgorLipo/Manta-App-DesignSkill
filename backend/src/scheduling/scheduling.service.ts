import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JobStatus, ScheduleStatus, Role } from '@prisma/client';
import { addDays, format } from 'date-fns';

@Injectable()
export class SchedulingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async proposeDate(jobId: string, adminId: string, proposedDate: Date) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.SCHEDULING_IN_PROGRESS && job.status !== JobStatus.SCHEDULED) {
      throw new BadRequestException('Job is not in scheduling state');
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        jobId,
        proposedDate,
        proposedBy: adminId,
        status: ScheduleStatus.PROPOSED,
      },
    });

    // Notify owner
    const owner = await this.prisma.owner.findFirst({
      where: { properties: { some: { id: job.propertyId } } },
    });
    if (owner) {
      await this.notifications.send(owner.userId, 'SCHEDULE_PROPOSED', {
        jobId,
      });
    }

    return schedule;
  }

  async ownerResponds(scheduleId: string, ownerId: string, response: 'confirm' | 'request_change' | 'unavailable', note?: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { job: true },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    if (response === 'confirm') {
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: ScheduleStatus.CONFIRMED, confirmedAt: new Date(), confirmedBy: ownerId },
      });
      await this.prisma.job.update({
        where: { id: schedule.jobId },
        data: { status: JobStatus.SCHEDULED },
      });

      const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, isActive: true } });
      for (const admin of admins) {
        await this.notifications.send(admin.id, 'SCHEDULE_CONFIRMED', { jobId: schedule.jobId });
      }
    } else if (response === 'request_change') {
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: ScheduleStatus.RESCHEDULE_REQUESTED, note },
      });
    }

    return { success: true };
  }

  async cancelSchedule(scheduleId: string, adminId: string) {
    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: ScheduleStatus.CANCELLED },
    });
    return { success: true };
  }

  async getJobSchedules(jobId: string) {
    return this.prisma.schedule.findMany({
      where: { jobId },
      orderBy: { proposedDate: 'desc' },
    });
  }

  async generateICS(jobId: string, scheduleId: string): Promise<string> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { job: { include: { property: true } } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Solar Ops//EN',
      'BEGIN:VEVENT',
      `DTSTART:${format(schedule.proposedDate, "yyyyMMdd'T'HHmmss")}`,
      `DTEND:${format(addDays(schedule.proposedDate, 1), "yyyyMMdd'T'HHmmss")}`,
      `SUMMARY:Scaffold Work - ${schedule.job.property.addressLine1}`,
      `DESCRIPTION:Address: ${schedule.job.property.addressLine1}, ${schedule.job.property.city}`,
      `LOCATION:${schedule.job.property.addressLine1}, ${schedule.job.property.city}, ${schedule.job.property.postcode}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return ics;
  }
}
