import path from 'node:path';
import { spawn } from 'node:child_process';
import { AppError } from '../../common/errors/AppError.js';

function run(program: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function validateArchive(archive: string): Promise<'zip' | 'tar'> {
  const ext = path.extname(archive).toLowerCase();
  if (ext === '.zip') {
    const result = await run('unzip', ['-Z1', archive]);
    if (result.code !== 0) throw new AppError(400, 'INVALID_ARCHIVE', 'ZIP archive could not be read');
    const entries = result.stdout.split(/\r?\n/).filter(Boolean);
    if (entries.length > 100_000) throw new AppError(413, 'ARCHIVE_TOO_LARGE', 'Archive contains too many entries');
    for (const entry of entries) {
      const normalized = entry.replaceAll('\\', '/');
      if (normalized.startsWith('/') || normalized.includes('../') || normalized === '..') throw new AppError(400, 'UNSAFE_ARCHIVE', 'Archive contains an unsafe path');
    }
    return 'zip';
  }
  if (['.tar', '.gz', '.tgz'].includes(ext)) {
    const result = await run('tar', ['-tzf', archive]);
    if (result.code !== 0) throw new AppError(400, 'INVALID_ARCHIVE', 'Archive could not be read');
    const entries = result.stdout.split(/\r?\n/).filter(Boolean);
    if (entries.length > 100_000) throw new AppError(413, 'ARCHIVE_TOO_LARGE', 'Archive contains too many entries');
    if (entries.some((entry) => entry.startsWith('/') || entry.includes('../'))) throw new AppError(400, 'UNSAFE_ARCHIVE', 'Archive contains an unsafe path');
    return 'tar';
  }
  throw new AppError(400, 'UNSUPPORTED_ARCHIVE', 'Only ZIP, TAR, GZ, and TGZ archives are supported');
}
