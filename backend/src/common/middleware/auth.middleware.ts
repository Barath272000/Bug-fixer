import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';
import type { AuthUser } from '../types/auth.js';

type TokenPayload = AuthUser & { iat: number; exp: number };

export const requireAuth: RequestHandler = (request, _response, next) => {
  try {
    const header = request.header('authorization');
    if (!header || !header.startsWith('Bearer ')) throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required');
    const token = header.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    request.user = { id: payload.id, email: payload.email, displayName: payload.displayName, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof AppError) { next(error); return; }
    next(new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid or expired'));
  }
};
