import { clearUserSessionCookie } from '../server/user-session.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  return res.status(200).json(
    { success: true },
    { 'Set-Cookie': clearUserSessionCookie() }
  );
}
