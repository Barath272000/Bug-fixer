import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  try {
    const id = request.header('x-request-id')?.trim() || randomUUID();
    request.requestId = id;
    response.setHeader('x-request-id', id);
    next();
  } catch (error) {
    next(error);
  }
};
