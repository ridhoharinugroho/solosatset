export interface SessionJwtPayloadDTO {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  nonce: string;
}

export interface UserSessionCookieOptionsDTO {
  name: string;
  maxAge: number;
  path: string;
  httpOnly: boolean;
  sameSite: "Lax" | "Strict" | "None";
  secure: boolean;
}
