import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { ensureStorageDirectories } from './config/storage.js';
import { RealtimeGateway } from './common/websocket/realtime.gateway.js';

const app = createApp();
const server = http.createServer(app);
const gateway = new RealtimeGateway();
gateway.attach(server);

async function bootstrap(): Promise<void> {
  try {
    await ensureStorageDirectories();
    await connectDatabase();
    await connectRedis();
    await gateway.subscribeToRedis();
    server.listen(env.PORT, '0.0.0.0', () => process.stdout.write(`BugFixAI backend listening on ${env.PORT}\n`));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  try {
    server.close();
    await gateway.closeRedisSubscription();
    await disconnectRedis();
    await disconnectDatabase();
    process.exit(signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
void bootstrap();
