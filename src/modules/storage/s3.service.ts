import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Minimal S3 client for dev / small deployments.
 * Enable with S3_BUCKET_NAME (+ AWS_REGION). Credentials optional on EC2 (IAM role).
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null;
  private readonly bucket: string | null;

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_BUCKET_NAME')?.trim();
    const region =
      this.config.get<string>('AWS_REGION')?.trim() || 'ca-central-1';

    if (!bucket) {
      this.bucket = null;
      this.client = null;
      return;
    }

    this.bucket = bucket;
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('AWS_SECRET_ACCESS_KEY')
      ?.trim();

    this.client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });

    this.logger.log(`S3 enabled: bucket=${bucket}, region=${region}`);
  }

  isConfigured(): boolean {
    return !!this.client && !!this.bucket;
  }

  async putObject(key: string, body: Buffer, contentType?: string) {
    if (!this.client || !this.bucket) {
      throw new Error('S3 is not configured (set S3_BUCKET_NAME)');
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      }),
    );
  }

  async deleteObject(key: string) {
    if (!this.client || !this.bucket || !key) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (e) {
      this.logger.warn(`S3 delete failed for key=${key}: ${e}`);
    }
  }

  async getPresignedGetUrl(key: string, expiresInSeconds?: number) {
    if (!this.client || !this.bucket) {
      throw new Error('S3 is not configured');
    }
    const fromEnv = this.config.get<string>('S3_PRESIGNED_URL_TTL_SECONDS');
    let ttl = 3600;
    if (expiresInSeconds != null && !Number.isNaN(expiresInSeconds)) {
      ttl = expiresInSeconds;
    } else if (fromEnv) {
      const n = Number(fromEnv);
      if (!Number.isNaN(n) && n > 0) ttl = n;
    }
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: ttl });
  }
}
