import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { apiRateLimit } from './common/middleware/rate-limit.middleware.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { errorMiddleware } from './common/errors/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { projectRoutes } from './modules/projects/project.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { bugRoutes } from './modules/bugs/bug.routes.js';
import { analysisRoutes } from './modules/analysis/analysis.routes.js';
import { fixRoutes } from './modules/fixes/fix.routes.js';
import { contextRoutes } from './modules/context-docs/context.routes.js';
import { workspaceRoutes } from './modules/workspace/workspace.routes.js';
import { copilotRoutes } from './modules/copilot/copilot.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { githubRoutes } from './modules/integrations/github/github.routes.js';
import { uploadsRoutes } from './modules/uploads/upload.routes.js';


function resolveAllowedOrigins(): string[] {
  const configured = env.CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);

  const codespaceName = process.env.CODESPACE_NAME;
  const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  if (codespaceName && forwardingDomain) {
    configured.push(`https://${codespaceName}-3000.${forwardingDomain}`);
    configured.push(`https://${codespaceName}-4000.${forwardingDomain}`);
  }

  return [...new Set(configured)];
}

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = resolveAllowedOrigins();
      const hostname = (() => {
        try {
          return new URL(requestOrigin).hostname;
        } catch {
          return requestOrigin;
        }
      })();

      const isLocalhost = /^localhost(?::\d+)?$/.test(hostname) || hostname === '127.0.0.1';
      const isCodespaceHost = /\.app\.github\.dev$/i.test(hostname) || /\.githubpreview\.dev$/i.test(hostname);
      const isExplicitlyAllowed = allowedOrigins.includes(requestOrigin);

      if (isExplicitlyAllowed || isLocalhost || isCodespaceHost) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ level: env.LOG_LEVEL }));
  app.use(apiRateLimit);

  app.get('/health', (_request, response) => response.json({ status: 'ok', service: 'bugfixai-backend', version: '1.0.0' }));
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/projects', uploadsRoutes);
  app.use('/api/v1/analysis', analysisRoutes);
  app.use('/api/v1/bugs', bugRoutes);
  app.use('/api/v1/fixes', fixRoutes);
  app.use('/api/v1/context', contextRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/v1/copilot', copilotRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/settings', settingsRoutes);
  app.use('/api/v1/github', githubRoutes);
  app.use(errorMiddleware);
  return app;
}
