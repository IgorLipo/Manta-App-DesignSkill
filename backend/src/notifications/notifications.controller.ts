import { Controller, Get, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  getNotifications(
    @Req() req: Request & { user: { userId: string } },
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.notifications.getInAppNotifications(req.user.userId, query.page, query.limit);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request & { user: { userId: string } }) {
    return this.notifications.getUnreadCount(req.user.userId);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request & { user: { userId: string } }) {
    return this.notifications.markAsRead(id, req.user.userId);
  }

  @Post('read-all')
  markAllAsRead(@Req() req: Request & { user: { userId: string } }) {
    return this.notifications.markAllAsRead(req.user.userId);
  }
}
