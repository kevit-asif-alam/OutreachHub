export interface JwtPayload {
  sub: string; // user ID
  email: string;
  isAdmin: boolean;
  portal: 'ADMIN' | 'APP';
  jti: string; // JWT ID for token tracking
  workspaceId?: string; // Only for APP portal
  iat?: number; // issued at
  exp?: number; // expiration time
}
