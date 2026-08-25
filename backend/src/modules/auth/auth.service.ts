import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { authRepository } from './auth.repository.js';

export async function registerUser(input: { email: string; password: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 12) throw new AppError(400,'WEAK_PASSWORD','Password must contain at least 12 characters');
  const existing = await authRepository.findByEmail(email);
  if (existing) throw new AppError(409,'EMAIL_EXISTS','An account already exists for this email');
  const passwordHash = await bcrypt.hash(input.password, 12);
  return authRepository.create({ email, passwordHash, displayName: input.displayName.trim() });
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await authRepository.findByEmail(input.email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401,'INVALID_CREDENTIALS','Email or password is incorrect');
  const payload = { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  return { user: payload, token: jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }) };
}
