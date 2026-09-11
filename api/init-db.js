import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method Not Allowed" });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
    return res.status(500).json({ success: false, error: "Database health configuration is unavailable." });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const report = {
      timestamp: new Date().toISOString(),
      database: "reachable",
      schema_management: "supabase_migrations_only",
    };
    for (const [table, column] of [
      ["users", "id"],
      ["site_settings", "id"],
      ["app_reviews", "id"],
      ["notifications", "id"],
    ]) {
      const { error } = await supabase.from(table).select(column).limit(1);
      report[`${table}_status`] = error ? "unavailable" : "ready";
    }
    const { error: otpError } = await supabase.from("users").select("otp_code, otp_expires_at").limit(1);
    report.otp_columns_status = otpError ? "unavailable" : "ready";
    const hasFailures = Object.keys(report).some((key) => key.endsWith("_status") && report[key] === "unavailable");
    return res
      .status(hasFailures ? 503 : 200)
      .json({
        success: !hasFailures,
        message: hasFailures
          ? "Database health check found unavailable schema elements."
          : "Database health check complete. No runtime schema mutation is performed.",
        report,
      });
  } catch (error) {
    console.error("[DB Health Handler Error]", { name: error.name, code: error.code });
    return res.status(500).json({ success: false, error: "Database health check failed." });
  }
}
