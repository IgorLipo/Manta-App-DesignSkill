import { Module } from '@nestjs/common';
import { ScaffoldersController } from './scaffolders.controller';
import { ScaffoldersService } from './scaffolders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ScaffoldersController],
  providers: [ScaffoldersService],
  exports: [ScaffoldersService],
})
export class ScaffoldersModule {}
