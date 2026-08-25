import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false });
export const authRateLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
