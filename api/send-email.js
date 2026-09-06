import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? (SMTP_PORT === 465)).toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Pusat Jual Beli Solo Raya';
const MAX_REQUESTS = 3;
const WINDOW_MS = 10 * 60 * 1000;
const rateLimiter = new Map();

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0]).trim();
}

function allowRequest(req) {
  const key = clientIp(req);
  const now = Date.now();
  const recent = (rateLimiter.get(key) || []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  rateLimiter.set(key, recent);
  return true;
}

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : '';
}

function buildTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  if (!allowRequest(req)) return res.status(429).json({ success: false, error: 'Terlalu banyak permintaan email. Silakan coba lagi nanti.' });

  const transporter = buildTransporter();
  if (!transporter) return res.status(503).json({ success: false, error: 'Layanan email belum dikonfigurasi di server.' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const action = String(body?.type || body?.action || '').trim().toLowerCase();
    const to = normalizeEmail(body?.to);
    const subject = String(body?.subject || '').slice(0, 300);
    const html = typeof body?.html === 'string' ? body.html.slice(0, 50000) : '';
    const text = typeof body?.text === 'string' ? body.text.slice(0, 20000) : '';

    // Generic/legacy mail dispatch is intentionally disabled. Registration and password-reset
    // mail are sent from their dedicated server endpoints. This route is kept only for SMTP tests.
    if (action !== 'test_smtp') {
      return res.status(403).json({ success: false, error: 'Jenis pengiriman email tidak diizinkan.' });
    }

    if (!to || (!html && !text)) {
      return res.status(400).json({ success: false, error: 'Penerima email dan isi pesan wajib diisi.' });
    }

    const configuredRecipient = normalizeEmail(SMTP_USER);
    if (!configuredRecipient || to !== configuredRecipient) {
      return res.status(403).json({ success: false, error: 'Email uji hanya dapat dikirim ke mailbox SMTP yang dikonfigurasi di server.' });
    }

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to,
      subject: subject || 'Uji Coba SMTP - Pusat Jual Beli Solo Raya',
      text: text || html.replace(/<[^>]*>/g, ' '),
      html: html || undefined
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email uji berhasil dikirim melalui server.'
    });
  } catch (error) {
    const authError = error?.code === 'EAUTH' || error?.responseCode === 535;
    console.error('[SMTP Server Error]', {
      name: error?.name,
      code: error?.code,
      responseCode: error?.responseCode,
      message: error?.message
    });

    return res.status(500).json({
      success: false,
      code: authError ? 'EAUTH' : 'SMTP_ERROR',
      error: authError ? 'Autentikasi SMTP gagal. Periksa kredensial SMTP pada environment server.' : 'Gagal mengirim email melalui server.'
    });
  }
}
