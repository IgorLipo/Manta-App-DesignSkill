import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { PhotoCategory } from '@prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_QUALITY = 0.8;

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService, private s3: S3Service) {}

  async uploadJobPhoto(
    jobId: string,
    uploaderId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    category: PhotoCategory,
    metadata?: { latitude?: number; longitude?: number },
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }

    const key = this.s3.generateKey(`jobs/${jobId}/photos`, file.originalname);

    // In production: compress image here using Sharp
    await this.s3.upload(key, file.buffer, file.mimetype, {
      'original-name': file.originalname,
      'uploaded-by': uploaderId,
      'job-id': jobId,
    });

    const photo = await this.prisma.jobPhoto.create({
      data: {
        jobId,
        uploaderId,
        category,
        fileName: file.originalname,
        storageKey: key,
        thumbnailKey: key, // In production: generate separate thumbnail
        mimeType: file.mimetype,
        fileSize: file.size,
        latitude: metadata?.latitude,
        longitude: metadata?.longitude,
        reviewStatus: 'PENDING',
      },
    });

    return photo;
  }

  async approvePhoto(photoId: string, adminId: string) {
    return this.prisma.jobPhoto.update({
      where: { id: photoId },
      data: { reviewStatus: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() },
    });
  }

  async rejectPhoto(photoId: string, adminId: string, note: string) {
    return this.prisma.jobPhoto.update({
      where: { id: photoId },
      data: { reviewStatus: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), reviewNote: note },
    });
  }

  async getJobPhotos(jobId: string) {
    return this.prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.prisma.jobPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return;
    if (photo.uploaderId !== userId) throw new BadRequestException('Cannot delete photo you did not upload');
    await this.s3.delete(photo.storageKey);
    await this.prisma.jobPhoto.delete({ where: { id: photoId } });
    return { success: true };
  }
}
