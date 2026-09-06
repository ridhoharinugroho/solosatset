import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { signUserSession, userSessionCookie } from '../server/user-session.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10 * 60 * 1000;
const registerLimiter = new Map();

function getAdminClient() { if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null; return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); }
function normalize(value) { return String(value || '').trim(); }
function normalizeEmail(value) { return normalize(value).toLowerCase(); }
function normalizePhone(value) { const digits = normalize(value).replace(/\D/g, ''); if (digits.startsWith('62')) return `0${digits.slice(2)}`; if (digits.startsWith('8')) return `0${digits}`; return digits; }
function hashPassword(password) { const salt = crypto.randomBytes(16), n = 16384, r = 8, p = 1; const hash = crypto.scryptSync(String(password), salt, 64, { N: n, r, p, maxmem: 32 * 1024 * 1024 }); return `scrypt$${n}$${r}$${p}$${salt.toString('hex')}:${hash.toString('hex')}`; }
function getRateKey(req, email) { const forwarded = req.headers?.['x-forwarded-for']; const ip = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim(); return `${ip}:${email}`; }
function allowRegistration(req, email) { const key = getRateKey(req, email), now = Date.now(); const current = (registerLimiter.get(key) || []).filter((ts) => now - ts < WINDOW_MS); if (current.length >= MAX_ATTEMPTS) return false; current.push(now); registerLimiter.set(key, current); return true; }
const USER_FIELDS = 'id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at,password_hash,password';
async function findExistingUser(supabase, email, phone, name, storeName) { const queries = [supabase.from('users').select(USER_FIELDS).eq('email', email).limit(1), supabase.from('users').select(USER_FIELDS).eq('name', name).limit(1), supabase.from('users').select(USER_FIELDS).eq('store_name', storeName).limit(1)]; if (phone) queries.push(supabase.from('users').select(USER_FIELDS).eq('phone', phone).limit(1)); const results = await Promise.all(queries); for (const result of results) { if (result.error) throw result.error; if (Array.isArray(result.data) && result.data[0]) return result.data[0]; } return null; }
function publicUser(user) { return { id: user.id, name: user.name, storeName: user.store_name || user.name, email: user.email, phone: user.phone, region: user.region, district: user.district, avatar: user.avatar ?? null, bio: user.bio ?? '', status: user.status || 'active', deletedAt: user.deleted_at || null, isDemo: user.is_demo || false, createdAt: user.created_at }; }
function getSmtpSettings() { const host = normalize(process.env.SMTP_HOST); const port = Number(process.env.SMTP_PORT || 587); const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465; const user = normalize(process.env.SMTP_USER); const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, ''); const fromName = normalize(process.env.SMTP_FROM_NAME || 'Pusat Jual Beli Solo Raya'); const fromEmail = normalize(process.env.SMTP_FROM || user); if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !fromEmail) return null; return { host, port, secure, user, pass, fromName, fromEmail }; }
async function sendWelcomeEmail(user) { const smtp = getSmtpSettings(); if (!smtp || !user.email) return; try { const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass }, connectionTimeout: 15000 }); await transporter.sendMail({ from: `"${smtp.fromName}" <${smtp.fromEmail}>`, to: user.email, subject: 'Selamat datang di Pusat Jual Beli Solo Raya', text: `Halo ${user.name || 'Penjual'}, akun Anda berhasil dibuat. Selamat mulai berjualan di Pusat Jual Beli Solo Raya.`, html: `<p>Halo ${user.name || 'Penjual'},</p><p>Akun Anda berhasil dibuat. Selamat mulai berjualan di Pusat Jual Beli Solo Raya.</p>` }); } catch (error) { console.warn('[Auth Register SMTP]', error.message); } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  const supabase = getAdminClient();
  if (!supabase) return res.status(503).json({ success: false, error: 'Authentication service is not configured on the server.' });
  try {
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const name = normalize(body?.name), storeName = normalize(body?.storeName), phone = normalizePhone(body?.phone), email = normalizeEmail(body?.email), region = normalize(body?.region).toLowerCase(), district = normalize(body?.district), password = String(body?.password || ''), confirmPassword = String(body?.confirmPassword || '');
    if (name.length < 2 || storeName.length < 2) return res.status(400).json({ success: false, error: 'Nama lengkap dan nama toko wajib diisi.' });
    if (!/^\+?[0-9 ()-]{9,20}$/.test(String(body?.phone || ''))) return res.status(400).json({ success: false, error: 'Nomor WhatsApp tidak valid.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: 'Alamat email tidak valid.' });
    if (password.length < 5) return res.status(400).json({ success: false, error: 'Password minimal 5 karakter.' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, error: 'Konfirmasi password tidak cocok.' });
    if (!region || !district) return res.status(400).json({ success: false, error: 'Kabupaten/Kota dan kecamatan wajib dipilih.' });
    if (!allowRegistration(req, email)) return res.status(429).json({ success: false, error: 'Terlalu banyak percobaan pendaftaran. Silakan coba lagi beberapa menit lagi.' });
    const existing = await findExistingUser(supabase, email, phone, name, storeName), existingStatus = String(existing?.status || '').toLowerCase(), isDeleted = Boolean(existing?.deleted_at) || existingStatus === 'deleted';
    if (existing && !isDeleted) return res.status(409).json({ success: false, error: 'Email, nomor WhatsApp, nama lengkap, atau nama toko sudah digunakan.' });
    const now = new Date().toISOString(), passwordHash = hashPassword(password); let data;
    if (existing && isDeleted) {
      const { data: restored, error } = await supabase.from('users').update({ name, store_name: storeName, email, phone, region, district, password_hash: passwordHash, password: null, status: 'active', deleted_at: null, updated_at: now }).eq('id', existing.id).select('id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at').single();
      if (error) throw error; data = restored;
    } else {
      const user = { id: `user-${Date.now()}-${crypto.randomInt(1000, 10000)}`, name, store_name: storeName, email, phone, region, district, password_hash: passwordHash, password: null, status: 'active', deleted_at: null, is_demo: false, created_at: now, updated_at: now };
      const { data: created, error } = await supabase.from('users').insert(user).select('id,name,store_name,email,phone,region,district,avatar,bio,status,deleted_at,is_demo,created_at').single();
      if (error) throw error; data = created;
    }
    await sendWelcomeEmail(data);
    const sessionToken = signUserSession(data);
    if (!sessionToken) return res.status(503).json({ success: false, error: 'User session service is not configured on the server.' });
    res.setHeader('Set-Cookie', userSessionCookie(sessionToken));
    return res.status(existing ? 200 : 201).json({ success: true, user: publicUser(data) });
  } catch (error) {
    console.error('[Auth Register Error]', { name: error.name, message: error.message });
    if (String(error.code || '') === '23505') return res.status(409).json({ success: false, error: 'Data akun sudah digunakan.' });
    return res.status(500).json({ success: false, error: 'Pendaftaran gagal diproses.' });
  }
}
