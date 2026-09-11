import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  USER_SESSION_COOKIE,
  signUserSession,
  getUserSessionFromRequest,
  userSessionCookie,
  clearUserSessionCookie,
} from "../server/user-session.js";

process.env.USER_SESSION_SECRET = crypto.randomBytes(32).toString("hex");

const user = { id: "user-negative-test", name: "Negative Test User" };
const token = signUserSession(user);
assert.ok(token, "session token should be created with a configured secret");
assert.equal(
  getUserSessionFromRequest({ headers: { cookie: `${USER_SESSION_COOKIE}=${encodeURIComponent(token)}` } })?.sub,
  user.id,
);

  // eslint-disable-next-line no-unused-vars
const [body, signature] = token.split(".");
const tamperedBody = Buffer.from(
  JSON.stringify({ sub: user.id, role: "user", iat: 1, exp: Math.floor(Date.now() / 1000) + 3600 }),
).toString("base64url");
assert.equal(
  getUserSessionFromRequest({ headers: { cookie: `${USER_SESSION_COOKIE}=${tamperedBody}.${signature}` } }),
  null,
  "tampered session must be rejected",
);
assert.equal(
  getUserSessionFromRequest({ headers: { cookie: `${USER_SESSION_COOKIE}=not-a-valid-token` } }),
  null,
  "malformed session must be rejected",
);

const expiredPayload = { sub: user.id, role: "user", iat: 1, exp: 1, nonce: "expired" };
const expiredBody = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
const expiredSignature = crypto
  .createHmac("sha256", process.env.USER_SESSION_SECRET)
  .update(expiredBody)
  .digest("base64url");
assert.equal(
  getUserSessionFromRequest({ headers: { cookie: `${USER_SESSION_COOKIE}=${expiredBody}.${expiredSignature}` } }),
  null,
  "expired session must be rejected",
);

assert.match(userSessionCookie(token), /HttpOnly/);
assert.match(userSessionCookie(token), /Secure/);
assert.match(clearUserSessionCookie(), /Max-Age=0/);

const originalSecret = process.env.USER_SESSION_SECRET;
delete process.env.USER_SESSION_SECRET;
assert.equal(signUserSession(user), "", "session signing must fail closed without a secret");
assert.equal(
  getUserSessionFromRequest({ headers: { cookie: `${USER_SESSION_COOKIE}=${encodeURIComponent(token)}` } }),
  null,
  "session verification must fail closed without a secret",
);
process.env.USER_SESSION_SECRET = originalSecret;

console.log("Security negative tests passed.");
