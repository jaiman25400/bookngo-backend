import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

/**
 * Deletes a single file if it exists.
 */
export async function deleteFileIfExists(filePath?: string | null) {
  if (!filePath) return;

  const fullPath = join(process.cwd(), filePath.startsWith('/') ? filePath.slice(1) : filePath);

  if (existsSync(fullPath)) {
    try {
      unlinkSync(fullPath);
    } catch (error) {
      console.error(`Error deleting file: ${fullPath}`, error);
    }
  }
}

/**
 * Deletes multiple files if they exist.
 */
export async function deleteMultipleFilesIfExist(filePaths?: string[] | null) {
  if (!filePaths?.length) return;
  await Promise.all(filePaths.map((path) => deleteFileIfExists(path)));
}
