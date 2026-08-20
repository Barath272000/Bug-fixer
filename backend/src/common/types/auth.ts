export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'USER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser; requestId?: string; }
  }
}
