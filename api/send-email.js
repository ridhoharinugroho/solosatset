import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * SMTP credentials are resolved server-side only.
 * The browser-supplied smtpConfig payload is intentionally ignored.
 */
async function getDynamicSmtpConfig() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Server SMTP configuration is unavailable. Required server environment variables are missing.');
  }

  const { data: dbRow, error: dbErr } = await supabaseAdmin
    .from('app_smtp_config')
    .select('settings_json')
    .eq('id', 'config')
    .maybeSingle();

  if (dbErr) throw new Error('Unable to load server-side SMTP configuration.');

  let config = {};
  if (dbRow?.settings_json) {
    try {
      const parsed = typeof dbRow.settings_json === 'string'
        ? JSON.parse(dbRow.settings_json)
        : dbRow.settings_json;
      if (parsed && typeof parsed === 'object') config = parsed;
    } catch {
      throw new Error('Server-side SMTP configuration is invalid.');
    }
  }

  const host = (process.env.SMTP_HOST || config.host || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || config.port || (host === 'smtp.gmail.com' ? 465 : 587));
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : (config.secure !== undefined ? Boolean(config.secure) : port === 465);
  const user = (process.env.SMTP_USER || config.user || '').trim();
  const pass = (process.env.SMTP_PASS || config.pass || '').replace(/\s+/g, '');
  const fromName = (process.env.SMTP_FROM_NAME || config.senderName || config.fromName || 'Pusat Jual Beli Solo Raya').trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || config.senderEmail || config.from || user).trim();

  if (!user || !pass) {
    throw new Error('SMTP server credentials are not configured.');
  }

  return { host, port, secure, user, pass, fromName, fromEmail };
}

/**
 * Serverless Email Dispatcher & SMTP Gateway.
 * Public transactional email is restricted to known application flows.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'Pusat Jual Beli Solo Raya - SMTP Mail Engine',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { action, to, subject, html, text, type } = body || {};

    // Admin SMTP test must wait for server-verifiable admin authorization.
    if (action === 'test_connection' || type === 'test_smtp') {
      return res.status(403).json({
        success: false,
        error: 'SMTP test requires server-side admin authorization and is temporarily disabled.'
      });
    }

    // Only application-owned transactional flows may use this public endpoint.
    const allowedTypes = new Set(['registration_welcome', 'password_reset']);
    if (!allowedTypes.has(type)) {
      return res.status(403).json({
        success: false,
        error: 'Unsupported email type.'
      });
    }

    if (!to || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Penerima email dan isi pesan wajib diisi.'
      });
    }

    const { host, port, secure, user, pass, fromName, fromEmail } = await getDynamicSmtpConfig();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: to.trim(),
      subject: subject || 'Pemberitahuan Akun - Pusat Jual Beli Solo Raya',
      text: text || '',
      html: html || text
    });

    console.log(`[SMTP EMAIL SUCCESS] Sent transactional email to: ${to}`);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email berhasil dikirim.'
    });
  } catch (error) {
    console.error('[SMTP Server Error]', {
      name: error.name,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message
    });

    const isAuthError = error.code === 'EAUTH' || error.responseCode === 535;
    return res.status(500).json({
      success: false,
      code: error.code || (isAuthError ? 'EAUTH' : 'SMTP_ERROR'),
      error: isAuthError
        ? 'Autentikasi SMTP gagal. Periksa konfigurasi SMTP server.'
        : (error.message || 'Gagal mengirim email melalui server SMTP.')
    });
  }
}
