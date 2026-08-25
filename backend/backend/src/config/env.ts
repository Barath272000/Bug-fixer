import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(2).default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(2).default('30d'),
  STORAGE_ROOT: z.string().min(1).default('./storage'),
  SANDBOX_WORK_ROOT: z.string().min(1).default('./sandbox-work'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(524288000),
  SANDBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(300000),
  SANDBOX_CPU_LIMIT: z.coerce.number().positive().default(2),
  SANDBOX_MEMORY_LIMIT: z.string().min(2).default('4g'),
  SANDBOX_PIDS_LIMIT: z.coerce.number().int().positive().default(256),
  SANDBOX_NETWORK_MODE: z.enum(['none','bridge']).default('none'),
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  GITHUB_APP_CLIENT_ID: z.string().optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().default('https://api.anthropic.com'),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_BASE_URL: z.string().url().default('https://generativelanguage.googleapis.com/v1beta'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com/v1'),
  DEFAULT_AI_PROVIDER: z.enum(['openai','anthropic','google','groq','openrouter','deepseek']).default('openai'),
  DEFAULT_AI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  ENCRYPTION_KEY: z.string().min(32),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info')
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
