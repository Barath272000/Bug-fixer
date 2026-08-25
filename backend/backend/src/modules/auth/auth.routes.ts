import { Router } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { authRateLimit } from '../../common/middleware/rate-limit.middleware.js';
import { register, login, me } from './auth.controller.js';
export const authRoutes = Router();
authRoutes.post('/register', authRateLimit, asyncHandler(register));
authRoutes.post('/login', authRateLimit, asyncHandler(login));
authRoutes.get('/me', requireAuth, asyncHandler(me));
