import { memoryStorage } from 'multer';

/** Align with Nginx `client_max_body_size` and Nest BODY_LIMIT_MB (default 25MB). */
const maxBytes =
  Number(process.env.UPLOAD_MAX_FILE_BYTES) ||
  (Number(process.env.BODY_LIMIT_MB) || 25) * 1024 * 1024;

/** Use with FileInterceptor / FileFieldsInterceptor so buffers are available for S3 upload. */
export const multerMemoryOptions = {
  storage: memoryStorage(),
  limits: { fileSize: maxBytes },
};
