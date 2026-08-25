import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from './env.js';

export async function ensureStorageDirectories(): Promise<void> {
  try {
    await fs.mkdir(env.STORAGE_ROOT, { recursive: true, mode: 0o750 });
    await fs.mkdir(env.SANDBOX_WORK_ROOT, { recursive: true, mode: 0o750 });
  } catch (error) {
    throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function projectStoragePath(projectId: string): string {
  return path.join(env.STORAGE_ROOT, 'projects', projectId);
}
