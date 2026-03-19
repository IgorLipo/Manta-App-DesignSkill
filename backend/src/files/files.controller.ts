import {
  Controller, Post, Get, Param, Body, UseGuards, Req, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PhotoCategory } from '@prisma/client';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private files: FilesService) {}

  @Post('photos/:jobId')
  @Roles('OWNER', 'SCAFFOLDER', 'ENGINEER')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadPhoto(
    @Param('jobId') jobId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: PhotoCategory,
    @Body('latitude') latitude?: string,
    @Body('longitude') longitude?: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.files.uploadJobPhoto(
      jobId,
      req.user.userId,
      file,
      category,
      { latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined },
    );
  }

  @Get('photos/:jobId')
  getPhotos(@Param('jobId') jobId: string) {
    return this.files.getJobPhotos(jobId);
  }

  @Post('photos/:photoId/approve')
  @Roles('ADMIN')
  approvePhoto(@Param('photoId') photoId: string, @Req() req: Request & { user: { userId: string } }) {
    return this.files.approvePhoto(photoId, req.user.userId);
  }

  @Post('photos/:photoId/reject')
  @Roles('ADMIN')
  rejectPhoto(
    @Param('photoId') photoId: string,
    @Req() req: Request & { user: { userId: string } },
    @Body('note') note: string,
  ) {
    return this.files.rejectPhoto(photoId, req.user.userId, note);
  }
}
