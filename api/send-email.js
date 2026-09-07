import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined
  ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
  : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Pusat Jual Beli Solo Raya';
const EMAIL_API_TOKEN = process.env.EMAIL_API_TOKEN;

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  if (!EMAIL_API_TOKEN || !SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return res.status(503).json({ success: false, error: 'Server email configuration is incomplete.' });
  }

  const token = getBearerToken(req);
  if (!token || token !== EMAIL_API_TOKEN) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { action, to, subject, html, text } = body || {};
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 15000
    });

    if (action === 'test_connection') {
      await transporter.verify();
      return res.status(200).json({ success: true, status: 'connected' });
    }

    if (!to || (!html && !text)) {
      return res.status(400).json({ success: false, error: 'Recipient and message are required.' });
    }

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: String(to).trim(),
      subject: subject || 'Pemberitahuan Akun - Pusat Jual Beli Solo Raya',
      text: text || '',
      html: html || text
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('[SMTP Server Error]', { code: error.code, responseCode: error.responseCode });
    return res.status(500).json({
      success: false,
      code: error.code || 'SMTP_ERROR',
      responseCode: error.responseCode || 500,
      error: 'Email delivery failed.'
    });
  }
}
