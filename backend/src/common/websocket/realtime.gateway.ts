import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';

export interface RealtimeEvent { type: string; projectId?: string; analysisId?: string; payload: unknown; }

// Every RealtimeGateway instance publishes to this Redis channel, and only the
// instance(s) with actual attached WebSocket servers subscribe to it. This is
// what lets a BullMQ worker process (which has no sockets of its own) notify
// browser clients connected to a different API process.
const REALTIME_CHANNEL = 'realtime:events';

export class RealtimeGateway {
  private readonly clients = new Map<string, Set<WebSocket>>();
  private server?: WebSocketServer;
  private subscriber?: import('ioredis').Redis;

  attach(httpServer: import('node:http').Server): void {
    this.server = new WebSocketServer({ noServer: true });
    httpServer.on('upgrade', (request, socket, head) => {
      try {
        const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
        if (url.pathname !== '/realtime') { socket.destroy(); return; }
        const token = url.searchParams.get('token');
        if (!token) { socket.destroy(); return; }
        jwt.verify(token, env.JWT_SECRET);
        this.server?.handleUpgrade(request, socket, head, (ws) => {
          const projectId = url.searchParams.get('projectId') ?? 'global';
          const current = this.clients.get(projectId) ?? new Set<WebSocket>();
          current.add(ws);
          this.clients.set(projectId, current);
          ws.on('close', () => {
            current.delete(ws);
            if (current.size === 0) this.clients.delete(projectId);
          });
          ws.on('error', () => ws.close());
          ws.send(JSON.stringify({ type: 'realtime.connected', payload: { projectId } }));
        });
      } catch {
        socket.destroy();
      }
    });
  }

  /**
   * Subscribes this gateway to Redis so events published by *other* processes
   * (e.g. the BullMQ worker) get forwarded to the sockets attached to this
   * process. Only call this on a gateway that has also called attach() —
   * a worker process should just call publish() and skip this.
   */
  async subscribeToRedis(): Promise<void> {
    if (this.subscriber) return;
    this.subscriber = redis.duplicate();
    await this.subscriber.subscribe(REALTIME_CHANNEL);
    this.subscriber.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        this.broadcastLocal(event);
      } catch {
        // ignore malformed events
      }
    });
  }

  async closeRedisSubscription(): Promise<void> {
    await this.subscriber?.quit();
    this.subscriber = undefined;
  }

  /** Sends an event to sockets attached to *this* process only. */
  private broadcastLocal(event: RealtimeEvent): void {
    const rooms = [event.projectId ?? 'global', 'global'];
    const data = JSON.stringify(event);
    const sent = new Set<WebSocket>();
    for (const room of rooms) {
      const sockets = this.clients.get(room);
      if (!sockets) continue;
      for (const socket of sockets) {
        if (sent.has(socket)) continue;
        if (socket.readyState === WebSocket.OPEN) socket.send(data);
        sent.add(socket);
      }
    }
  }

  /**
   * Publishes an event both to any sockets attached to this process (fast
   * path, works standalone in dev) and to Redis (so other processes' sockets
   * get it too). Safe to call from a worker process that never attached.
   */
  publish(projectId: string | undefined, event: RealtimeEvent): void {
    const fullEvent: RealtimeEvent = { ...event, projectId };
    this.broadcastLocal(fullEvent);
    void redis.publish(REALTIME_CHANNEL, JSON.stringify(fullEvent)).catch(() => {
      // best-effort — a dropped realtime event shouldn't crash the pipeline
    });
  }
}

export async function publishRedisEvent(channel: string, event: RealtimeEvent): Promise<void> {
  await redis.publish(channel, JSON.stringify(event));
}
