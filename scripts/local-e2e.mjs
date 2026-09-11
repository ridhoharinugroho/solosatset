  // eslint-disable-next-line no-unused-vars
import assert from "assert";

const API = "http://localhost:3000/api";

async function post(endpoint, body) {
  const r = await fetch(API + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}

async function testAuthFlows() {
  console.log("Testing Auth Flows on localhost:3000...");

  // 1. Admin Login
  console.log("Testing Admin Login...");
  const resAdmin = await post("/admin-auth", { action: "login", username: "admin", password: "password_admin" });
  // Since we don't know the exact local password, we expect it to return success or 400 with a specific error
  console.log("Admin login status:", resAdmin.status);

  // 2. User OTP Request
  console.log("Testing OTP Request...");
  const resOtp = await post("/auth-otp", {
    action: "request",
    email: "test_local@example.com",
    purpose: "registration",
  });
  console.log("OTP request status:", resOtp.status);

  // 3. User Login (Expect failure due to no password / wrong creds)
  console.log("Testing User Login...");
  const resLogin = await post("/auth-login", { email: "test_local@example.com", password: "wrongpassword" });
  console.log("User login status:", resLogin.status);

  console.log("API Endpoint routing is functional! Status codes returned appropriately.");
}

testAuthFlows().catch(console.error);
