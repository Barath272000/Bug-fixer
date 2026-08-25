import { Redis as IORedis } from 'ioredis';
import { env } from './env.js';

export const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });

export async function connectRedis(): Promise<void> {
  try {
    await redis.ping();
  } catch (error) {
    throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
  } catch (error) {
    throw new Error(`Redis disconnect failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
