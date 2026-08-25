import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';

export interface RealtimeEvent { type: string; projectId?: string; analysisId?: string; payload: unknown; }

export class RealtimeGateway {
  private readonly clients = new Map<string, Set<WebSocket>>();
  private server?: WebSocketServer;

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

  publish(projectId: string | undefined, event: RealtimeEvent): void {
    const rooms = [projectId ?? 'global', 'global'];
    for (const room of rooms) {
      const sockets = this.clients.get(room);
      if (!sockets) continue;
      const data = JSON.stringify(event);
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) socket.send(data);
      }
    }
  }
}

export async function publishRedisEvent(channel: string, event: RealtimeEvent): Promise<void> {
  await redis.publish(channel, JSON.stringify(event));
}
