import { memoryStorage } from 'multer';

/** Use with FileInterceptor / FileFieldsInterceptor so buffers are available for S3 upload. */
export const multerMemoryOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
};
