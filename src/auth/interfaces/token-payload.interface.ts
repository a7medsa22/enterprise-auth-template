export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}