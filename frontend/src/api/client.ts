/**
 * Core fetch wrapper for talking to the BugFixer backend.
 *
 * AUTH (temporary, until a real login screen is built):
 * Run `npm run seed:dev-user` in /backend, copy the printed JWT below.
 * Every request automatically sends it as `Authorization: Bearer <token>`.
 * Swap this out for a real auth flow (stored token from /auth/login)
 * once the login screen exists — search this file for "DEV_TOKEN".
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const API_PREFIX = '/api/v1';

// TODO: replace with the token printed by `npm run seed:dev-user` (backend/prisma/seed-dev-user.ts)
const DEV_TOKEN = 'const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRjMmU4OWNhLWZkMGEtNDU5MS1iMGU2LTIxNWM1NDkxMDM2MyIsImVtYWlsIjoiZGV2QGJ1Z2ZpeGVyLmxvY2FsIiwiZGlzcGxheU5hbWUiOiJEZXYgVXNlciIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzg3NTY5NTUxLCJleHAiOjE3OTAxNjE1NTF9.IZURBDLn1tyXQEFQIpF9SUpzQxKTSBESXdMKBt_1i5M';';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (DEV_TOKEN) headers.Authorization = `Bearer ${DEV_TOKEN}`;

  let response: Response;
  try {
    const fullPath = path === '/health' ? path : `${API_PREFIX}${path}`;
    response = await fetch(`${API_BASE_URL}${fullPath}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the backend. Is it running?');
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as { message?: string; code?: string; error?: { message?: string; code?: string } } | null;
    const message =
      errorPayload?.message ?? errorPayload?.error?.message ?? `Request failed with status ${response.status}`;
    const code = errorPayload?.code ?? errorPayload?.error?.code;
    throw new ApiError(response.status, message, code);
  }

  return payload as T;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const result = await apiRequest<{ status: string }>('/health');
    return result.status === 'ok';
  } catch {
    return false;
  }
}
