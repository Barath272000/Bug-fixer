import { z } from 'zod';
import { registerUser, loginUser } from './auth.service.js';

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(12), displayName: z.string().min(1).max(80) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function register(request: import('express').Request, response: import('express').Response): Promise<void> {
  try { const input = registerSchema.parse(request.body); const user = await registerUser(input); response.status(201).json({ user }); } catch (error) { throw error; }
}
export async function login(request: import('express').Request, response: import('express').Response): Promise<void> {
  try { const input = loginSchema.parse(request.body); response.json(await loginUser(input)); } catch (error) { throw error; }
}
export async function me(request: import('express').Request, response: import('express').Response): Promise<void> { try { response.json({ user: request.user }); } catch (error) { throw error; } }
