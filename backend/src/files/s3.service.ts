import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.client = new S3Client({
      region: config.get('AWS_REGION', 'eu-west-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
    this.bucket = config.get('S3_BUCKET', 'solar-ops-uploads');
  }

  async upload(key: string, body: Buffer, mimeType: string, metadata?: Record<string, string>) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
        Metadata: metadata,
        // Set cache headers for images
        CacheControl: 'max-age=31536000',
      }),
    );
    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = `https://${this.bucket}.s3.eu-west-1.amazonaws.com/${key}`;
    return url; // In production, use getSignedUrl from @aws-sdk/s3-request-presigner
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  generateKey(prefix: string, filename: string): string {
    const ext = filename.split('.').pop();
    return `${prefix}/${uuid()}.${ext}`;
  }
}
