import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rwjqqoulqdmtsweuvbef.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Read-only database health endpoint.
 *
 * Schema changes are managed exclusively by Supabase migrations.
 * This endpoint only verifies that the required runtime tables are reachable.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  if (!SUPABASE_ANON_KEY) {
    return res.status(500).json({ success: false, error: 'SUPABASE_ANON_KEY is not configured' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const report = {
      timestamp: new Date().toISOString(),
      database: 'reachable',
      schema_management: 'supabase_migrations_only'
    };

    const checks = [
      ['users', 'id'],
      ['site_settings', 'id'],
      ['app_reviews', 'id'],
      ['notifications', 'id']
    ];

    for (const [table, column] of checks) {
      const { error } = await supabase.from(table).select(column).limit(1);
      if (error) {
        report[`${table}_status`] = 'unavailable';
        report[`${table}_error`] = error.message;
      } else {
        report[`${table}_status`] = 'ready';
      }
    }

    const { error: otpError } = await supabase
      .from('users')
      .select('otp_code, otp_expires_at')
      .limit(1);

    report.otp_columns_status = otpError ? 'unavailable' : 'ready';
    if (otpError) report.otp_columns_error = otpError.message;

    const hasFailures = Object.keys(report).some(key => key.endsWith('_status') && report[key] === 'unavailable');

    return res.status(hasFailures ? 503 : 200).json({
      success: !hasFailures,
      message: hasFailures
        ? 'Database health check found unavailable schema elements.'
        : 'Database health check complete. No runtime schema mutation is performed.',
      report
    });
  } catch (error) {
    console.error('[DB Health Handler Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
