import { z } from 'zod';

export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
export function pagination(input: unknown): { page: number; limit: number; skip: number } {
  const parsed = paginationSchema.parse(input);
  return { page: parsed.page, limit: parsed.limit, skip: (parsed.page - 1) * parsed.limit };
}
