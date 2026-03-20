import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { UploadsService } from './uploads.service';

@Global()
@Module({
  providers: [S3Service, UploadsService],
  exports: [S3Service, UploadsService],
})
export class StorageModule {}
