import { describe, it, expect, beforeAll } from "vitest";
import { signUserSession, getUserSessionFromRequest, userSessionCookie } from "../server/user-session.js";

describe("User Session & HMAC Security", () => {
  beforeAll(() => {
    process.env.USER_SESSION_SECRET = "test-secret-123";
  });

  it("should generate valid session and verify HMAC", () => {
    const user = { id: "user-123" };
    const token = signUserSession(user);
    expect(token).toBeTruthy();

    const cookieStr = userSessionCookie(token);
    const req = { headers: { cookie: cookieStr } };

    const payload = getUserSessionFromRequest(req);
    expect(payload).toBeTruthy();
    expect(payload.sub).toBe("user-123");
  });

  it("should reject tampered session", () => {
    const user = { id: "user-123" };
    const token = signUserSession(user);
    const [body, signature] = token.split(".");

    const tamperedBody = body.substring(0, body.length - 1) + "X";
    const tamperedToken = `${tamperedBody}.${signature}`;

    const cookieStr = userSessionCookie(tamperedToken);
    const req = { headers: { cookie: cookieStr } };

    const payload = getUserSessionFromRequest(req);
    expect(payload).toBeNull();
  });
});
