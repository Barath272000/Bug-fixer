/**
 * DEV-ONLY. Creates (or reuses) one dev user and prints a long-lived JWT
 * you can hardcode in the frontend during development, so there's no need
 * to build a login screen yet.
 *
 * Run with:
 *   cd backend
 *   npx tsx prisma/seed-dev-user.ts
 *
 * Requires: Postgres running and migrations applied (npx prisma migrate dev)
 * plus backend/.env present (already generated for you).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

const DEV_EMAIL = 'dev@bugfixer.local';
const DEV_PASSWORD = 'dev-password-CHANGE-ME-123'; // 12+ chars to satisfy registerUser's rule, unused after seeding
const DEV_DISPLAY_NAME = 'Dev User';

async function main(): Promise<void> {
  try {
    let user = await prisma.user.findUnique({ where: { email: DEV_EMAIL } });

    if (!user) {
      const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
      user = await prisma.user.create({
        data: { email: DEV_EMAIL, passwordHash, displayName: DEV_DISPLAY_NAME },
      });
      console.log(`Created dev user: ${DEV_EMAIL}`);
    } else {
      console.log(`Reusing existing dev user: ${DEV_EMAIL}`);
    }

    // Sign the same shape of payload auth.service.ts uses on real login,
    // but with a long expiry so you don't have to keep regenerating it.
    const payload = { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });

    console.log('\n=== Dev JWT (paste into frontend/src/api/client.ts) ===\n');
    console.log(token);
    console.log('\n========================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
