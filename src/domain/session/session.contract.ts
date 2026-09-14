export interface UserSession {
  userId: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
  isValid: boolean;
}
