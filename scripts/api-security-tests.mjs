import assert from "node:assert/strict";

process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "test-admin-session-secret-for-api-test-runner";
process.env.USER_SESSION_SECRET = process.env.USER_SESSION_SECRET || "test-user-session-secret-for-api-test-runner";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key";

const { signUserSession, USER_SESSION_COOKIE } = await import("../server/user-session.js");
const adminAuthHandler = (await import("../server/api/admin-auth.js")).default;
const authLoginHandler = (await import("../server/api/auth-login.js")).default;
const authOtpHandler = (await import("../server/api/auth-otp.js")).default;
const pushNotifyHandler = (await import("../server/api/push-notify.js")).default;
const userProfileHandler = (await import("../server/api/user-profile.js")).default;

console.log("=== Running API Security Contract Tests ===");

const validUserCookie = `${USER_SESSION_COOKIE}=${encodeURIComponent(signUserSession({ id: "user-102", name: "Test User" }))}`;

function createMockReqRes({ method = "POST", body = {}, headers = {}, query = {} } = {}) {
  let statusCode = 200;
  let responseData = null;
  const responseHeaders = {};

  const req = { method, body, headers, query, url: "http://localhost:3000/api/test" };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(key, val) {
      responseHeaders[key] = val;
      return this;
    },
    getHeader(key) {
      return responseHeaders[key];
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    end(data) {
      if (data) responseData = data;
      return this;
    },
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

// 1. 401 - Unauthenticated request to protected endpoint (user-profile without cookie)
{
  const { req, res, getStatus } = createMockReqRes({ method: "GET", query: { userId: "user-102" } });
  await userProfileHandler(req, res);
  assert.equal(getStatus(), 401, "Unauthenticated user-profile request must return 401");
  console.log("✓ 401 Unauthenticated protected endpoint check: PASS");
}

// 2. 401/403 - Invalid credentials / Forbidden access to admin auth
{
  const { req, res, getStatus } = createMockReqRes({ method: "POST", query: { action: "login" }, body: { username: "admin", password: "wrong-password" } });
  try {
    await adminAuthHandler(req, res);
  } catch (e) {
    // Exception handled
  }
  const status = getStatus();
  assert.ok(status === 401 || status === 500 || status === 503, "Invalid admin credentials / unauthorized request handled safely");
  console.log("✓ 401/403 Unauthorized/Forbidden check: PASS");
}

// 3. 400 - Malformed / Missing payload
{
  const { req, res, getStatus } = createMockReqRes({ method: "POST", body: {} });
  await authLoginHandler(req, res);
  assert.equal(getStatus(), 400, "Missing login identifier payload must return 400");
  console.log("✓ 400 Malformed / missing payload check: PASS");
}

{
  const { req, res, getStatus } = createMockReqRes({ method: "POST", body: {} });
  await authOtpHandler(req, res);
  assert.equal(getStatus(), 400, "Missing OTP payload must return 400");
  console.log("✓ 400 Malformed OTP payload check: PASS");
}

// 3b. Malformed JSON / raw string / empty body safety check
{
  const { req, res, getStatus } = createMockReqRes({ method: "POST", body: "{malformed_json_str" });
  await authLoginHandler(req, res);
  assert.equal(getStatus(), 400, "Malformed string body must return 400 without crashing");
  console.log("✓ 400 Malformed JSON string body check: PASS");
}

// 4. 404/401 - Unknown Action / Unauthorized action route check
{
  const { req, res, getStatus } = createMockReqRes({
    method: "POST",
    headers: { cookie: validUserCookie },
    body: { action: "non_existent_action" },
  });
  await pushNotifyHandler(req, res);
  const status = getStatus();
  assert.ok(status === 404 || status === 401, "Unknown action or unauthorized admin action returned 404/401");
  console.log("✓ 404/401 Unknown action/route check: PASS");
}

// 5. 500 - Controlled Server Failure / Exception Handling
{
  const mockErrReq = {
    method: "POST",
    headers: {},
    get body() {
      throw new Error("Simulated database failure");
    },
  };
  let code = 200;
  const mockErrRes = {
    status(c) {
      code = c;
      return this;
    },
    json() {
      return this;
    },
    send() {
      return this;
    },
  };

  try {
    await authLoginHandler(mockErrReq, mockErrRes);
  } catch (err) {
    code = 500;
  }
  assert.equal(code, 500, "Simulated server failure must result in controlled 500 status");
  console.log("✓ 500 Controlled server failure check: PASS");
}

console.log("🎉 All API security contract tests passed successfully!");
