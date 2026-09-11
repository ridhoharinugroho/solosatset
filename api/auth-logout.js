import { clearUserSessionCookie } from "../server/user-session.js";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });
  res.setHeader("Set-Cookie", clearUserSessionCookie(req));
  return res.status(200).json({ success: true });
}
