/**
 * Core fetch wrapper for talking to the BugFixer backend.
 *
 * AUTH (temporary, until a real login screen is built):
 * Run `npm run seed:dev-user` in /backend, copy the printed JWT below.
 * Every request automatically sends it as `Authorization: Bearer <token>`.
 * Swap this out for a real auth flow (stored token from /auth/login)
 * once the login screen exists — search this file for "DEV_TOKEN".
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const API_PREFIX = '/api/v1';

// TODO: replace with the token printed by `npm run seed:dev-user` (backend/prisma/seed-dev-user.ts)
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFjYTkxYmRjLTE4NGUtNGQ5NS04MTQzLTZmMmE1MDMxYjk1YyIsImVtYWlsIjoiZGV2QGJ1Z2ZpeGVyLmxvY2FsIiwiZGlzcGxheU5hbWUiOiJEZXYgVXNlciIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzg3NjU3MDY0LCJleHAiOjE3OTAyNDkwNjR9.6t9ShnEuskJnue8ITagpLzR4ReFagfshCue9jhPayTo';

export function getAuthToken(): string {
  return DEV_TOKEN;
}

/** Builds the ws(s):// URL for the realtime gateway, scoped to a project. */
export function getRealtimeSocketUrl(projectId: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, 'ws');
  const params = new URLSearchParams({ token: getAuthToken(), projectId });
  return `${wsBase}/realtime?${params.toString()}`;
}

/** Uploads a project archive (multipart/form-data) — separate from apiRequest since it isn't JSON. */
export async function uploadProjectArchive(projectId: string, file: File): Promise<{ storagePath: string; sha256: string }> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}/projects/${projectId}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the backend. Is it running?');
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.message ?? payload?.error?.message ?? `Upload failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload?.code ?? payload?.error?.code);
  }
  return payload;
}

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
