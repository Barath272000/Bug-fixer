import path from 'node:path';
import { AppError } from '../errors/AppError.js';

export function resolveSafePath(root: string, target: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(root, target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) throw new AppError(400, 'INVALID_PATH', 'Path escapes the allowed root');
  return resolvedTarget;
}
