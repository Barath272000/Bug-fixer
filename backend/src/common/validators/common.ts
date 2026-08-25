import { z } from 'zod';

export const idSchema = z.string().uuid();
export const severitySchema = z.enum(['Critical','High','Medium','Low']);
export const bugStatusSchema = z.enum(['Open','In Review','Fixed','Closed','AI Suggested','Applying Fix']);
export const aiStatusSchema = z.enum(['Pending','Ready','Applied']);
