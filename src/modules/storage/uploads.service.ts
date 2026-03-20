import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { S3Service } from './s3.service';

/**
 * Persists multipart files to S3 (when configured) or local uploads/ (fallback).
 * DB stores either an S3 object key (e.g. CMS/activity/123.jpg) or /uploads/... path.
 */
@Injectable()
export class UploadsService {
  constructor(
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {}

  useS3(): boolean {
    return this.s3.isConfigured();
  }

  /**
   * Requires multer memoryStorage so file.buffer is set.
   */
  async persistMulterFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${this.safeBasename(file.originalname)}`;

    if (this.s3.isConfigured()) {
      if (!file.buffer?.length) {
        throw new Error(
          'File buffer missing — use memoryStorage() for uploads when S3 is enabled',
        );
      }
      const key = `${folder.replace(/^\/+|\/+$/g, '')}/${uniqueName}`;
      await this.s3.putObject(key, file.buffer, file.mimetype);
      return key;
    }

    const relativeFolder = folder.replace(/^\/+|\/+$/g, '');
    const destDir = join(process.cwd(), 'uploads', relativeFolder);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    const diskPath = join(destDir, uniqueName);
    if (!file.buffer?.length) {
      throw new Error(
        'File buffer missing — use memoryStorage() for local uploads',
      );
    }
    writeFileSync(diskPath, file.buffer);
    return `/uploads/${relativeFolder}/${uniqueName}`.replace(/\\/g, '/');
  }

  async persistMulterFiles(
    files: Express.Multer.File[] | undefined,
    folder: string,
  ): Promise<string[]> {
    if (!files?.length) return [];
    return Promise.all(files.map((f) => this.persistMulterFile(f, folder)));
  }

  async deleteStored(ref: string | null | undefined): Promise<void> {
    if (!ref) return;
    if (ref.startsWith('http://') || ref.startsWith('https://')) return;
    if (ref.startsWith('/uploads')) {
      const rel = ref.startsWith('/') ? ref.slice(1) : ref;
      const fullPath = join(process.cwd(), rel);
      if (existsSync(fullPath)) {
        try {
          unlinkSync(fullPath);
        } catch (e) {
          console.error(`Failed to delete local file ${fullPath}`, e);
        }
      }
      return;
    }
    await this.s3.deleteObject(ref);
  }

  async deleteManyStored(refs: string[] | null | undefined): Promise<void> {
    if (!refs?.length) return;
    await Promise.all(refs.map((r) => this.deleteStored(r)));
  }

  /**
   * User-facing URL: presigned GET for S3 keys, API_PUBLIC_URL + path for /uploads.
   */
  async resolveDisplayUrl(
    ref: string | null | undefined,
  ): Promise<string | null> {
    if (ref == null || ref === '') return null;
    if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
    if (ref.startsWith('/uploads')) {
      const base =
        this.config.get<string>('API_PUBLIC_URL')?.replace(/\/$/, '') || '';
      return base ? `${base}${ref}` : ref;
    }
    if (this.s3.isConfigured()) {
      return this.s3.getPresignedGetUrl(ref);
    }
    return ref;
  }

  async resolveDisplayUrlList(
    refs: string[] | null | undefined,
  ): Promise<(string | null)[]> {
    if (!refs?.length) return [];
    return Promise.all(refs.map((r) => this.resolveDisplayUrl(r)));
  }

  private safeBasename(name: string): string {
    const base = name.replace(/\\/g, '/').split('/').pop() || 'file';
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    return (cleaned || 'file').slice(0, 180);
  }
}
