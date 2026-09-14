import type { SessionJwtPayloadDTO } from "./session.dto";
import type { UserSession } from "./session.contract";

export function mapSessionPayloadToDomain(payload: SessionJwtPayloadDTO | null | undefined): UserSession {
  if (!payload || typeof payload !== "object" || !payload.sub) {
    return {
      userId: "",
      role: "guest",
      issuedAt: 0,
      expiresAt: 0,
      isValid: false,
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isValid = Boolean(payload.exp && payload.exp > nowSeconds && payload.role === "user");

  return {
    userId: String(payload.sub),
    role: String(payload.role || "guest"),
    issuedAt: Number(payload.iat) || 0,
    expiresAt: Number(payload.exp) || 0,
    isValid,
  };
}
