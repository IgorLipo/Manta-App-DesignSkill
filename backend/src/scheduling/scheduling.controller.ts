import { Controller, Get, Post, Param, Body, UseGuards, Req, Res } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private scheduling: SchedulingService) {}

  @Post(':jobId/propose')
  @Roles('ADMIN')
  proposeDate(
    @Param('jobId') jobId: string,
    @Req() req: Request & { user: { userId: string } },
    @Body('proposedDate') proposedDate: string,
  ) {
    return this.scheduling.proposeDate(jobId, req.user.userId, new Date(proposedDate));
  }

  @Post('schedules/:scheduleId/respond')
  @Roles('OWNER')
  ownerRespond(
    @Param('scheduleId') scheduleId: string,
    @Req() req: Request & { user: { userId: string } },
    @Body() body: { response: 'confirm' | 'request_change' | 'unavailable'; note?: string },
  ) {
    return this.scheduling.ownerResponds(scheduleId, req.user.userId, body.response, body.note);
  }

  @Post('schedules/:scheduleId/cancel')
  @Roles('ADMIN')
  cancelSchedule(@Param('scheduleId') scheduleId: string, @Req() req: Request & { user: { userId: string } }) {
    return this.scheduling.cancelSchedule(scheduleId, req.user.userId);
  }

  @Get(':jobId/schedules')
  getSchedules(@Param('jobId') jobId: string) {
    return this.scheduling.getJobSchedules(jobId);
  }

  @Get('schedules/:scheduleId/ics')
  getICS(@Param('scheduleId') scheduleId: string, @Res() res: any) {
    return this.scheduling.generateICS('', scheduleId).then((ics) => {
      res.set('Content-Type', 'text/calendar');
      res.send(ics);
    });
  }
}
