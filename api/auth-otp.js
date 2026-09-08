import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_MS = 60 * 1000;
const VERIFY_TTL_MS = 10 * 60 * 1000;

function admin(){
  if(!SUPABASE_URL||!SERVICE_KEY) throw new Error('Server database configuration is unavailable.');
  return createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
function hash(v){return crypto.createHash('sha256').update(String(v)).digest('hex');}
function otp(){return crypto.randomInt(100000,1000000).toString();}
function cleanEmail(v){return String(v||'').trim().toLowerCase();}
function makeVerificationMarker(code){return `verified:${hash(code)}:${crypto.randomBytes(16).toString('hex')}`;}

async function smtp(){
  const db=admin();
  const {data,error}=await db.from('app_smtp_config').select('settings_json').eq('id','config').maybeSingle();
  if(error) throw new Error('Server SMTP configuration is unavailable.');
  let c={};
  try{c=data?.settings_json?(typeof data.settings_json==='string'?JSON.parse(data.settings_json):data.settings_json):{};}catch{throw new Error('Server SMTP configuration is invalid.');}
  const host=(process.env.SMTP_HOST||c.host||'smtp.gmail.com').trim();
  const port=Number(process.env.SMTP_PORT||c.port||(host==='smtp.gmail.com'?465:587));
  const secure=process.env.SMTP_SECURE!==undefined?process.env.SMTP_SECURE==='true':(c.secure!==undefined?Boolean(c.secure):port===465);
  const user=(process.env.SMTP_USER||c.user||'').trim();
  const pass=(process.env.SMTP_PASS||c.pass||'').replace(/\s+/g,'');
  const fromName=(process.env.SMTP_FROM_NAME||c.senderName||c.fromName||'Pusat Jual Beli Solo Raya').trim();
  const fromEmail=(process.env.SMTP_FROM_EMAIL||c.senderEmail||c.from||user).trim();
  if(!user||!pass) throw new Error('SMTP server credentials are not configured.');
  return{host,port,secure,user,pass,fromName,fromEmail};
}

async function sendOtpEmail(email,code,purpose){
  const s=await smtp();
  const labels={registration:'pendaftaran akun',password_reset:'reset password',password_change:'ganti password'};
  const label=labels[purpose]||'verifikasi akun';
  const t=nodemailer.createTransport({host:s.host,port:s.port,secure:s.secure,auth:{user:s.user,pass:s.pass},tls:{rejectUnauthorized:true},connectionTimeout:15000});
  await t.sendMail({
    from:`"${s.fromName}" <${s.fromEmail}>`,
    to:email,
    subject:`Kode OTP ${label} - Pusat Jual Beli Solo Raya`,
    text:`Kode OTP Anda untuk ${label} adalah ${code}. Kode berlaku 10 menit. Jangan berikan kode ini kepada siapa pun.`,
    html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Pusat Jual Beli Solo Raya</h2><p>Kode OTP untuk <b>${label}</b>:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px;background:#f1f5f9;border-radius:12px;text-align:center">${code}</div><p>Kode berlaku 10 menit. Jangan berikan kode ini kepada siapa pun.</p></div>`
  });
}

async function getUserByEmail(db,email){
  const {data,error}=await db.from('users').select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,otp_code,otp_expires_at,password_hash,password,is_verified').eq('email',email).maybeSingle();
  if(error) throw new Error('Data akun tidak dapat dibaca.');
  return data||null;
}

async function requireUser(db,email){
  const data=await getUserByEmail(db,email);
  if(!data||data.deleted_at||(data.status||'active').toLowerCase()==='deleted') throw new Error('Akun tidak ditemukan.');
  if((data.status||'active').toLowerCase()==='suspended') throw new Error('Akun sedang ditangguhkan oleh Admin.');
  return data;
}

async function ensureRegistrationUser(db,email,now){
  const existing=await getUserByEmail(db,email);
  if(existing){
    if(existing.deleted_at||(existing.status||'active').toLowerCase()==='deleted') throw new Error('Email sudah terdaftar.');
    if(existing.name||existing.password_hash||existing.password) throw new Error('Email sudah terdaftar.');
    return existing;
  }
  const id=`user-${Date.now()}-${crypto.randomInt(1000,9999)}`;
  const {data,error}=await db.from('users').insert({id,email,status:'pending',is_demo:false,otp_code:null,otp_expires_at:null,created_at:new Date(now).toISOString()}).select('id,name,email,phone,region,district,store_name,avatar,bio,status,deleted_at,is_demo,otp_code,otp_expires_at,password_hash,password,is_verified').single();
  if(error) throw new Error('Gagal menyiapkan pendaftaran.');
  return data;
}

async function saveOtp(db,user,code,now){
  const currentExpiry=user.otp_expires_at?new Date(user.otp_expires_at).getTime():0;
  if(user.otp_code&&currentExpiry>now-RESEND_MS){
    const age=OTP_TTL_MS-(currentExpiry-now);
    if(age<RESEND_MS) throw new Error('Tunggu 60 detik sebelum meminta OTP lagi.');
  }
  const expiresAt=new Date(now+OTP_TTL_MS).toISOString();
  const {error}=await db.from('users').update({otp_code:hash(code),otp_expires_at:expiresAt,updated_at:new Date(now).toISOString()}).eq('id',user.id);
  if(error) throw new Error('Gagal menyimpan OTP.');
}

async function verifyCode(db,email,code){
  const user=await requireUser(db,email);
  const expiresAt=user.otp_expires_at?new Date(user.otp_expires_at).getTime():0;
  if(!user.otp_code||!expiresAt||Date.now()>expiresAt) throw new Error('Kode OTP tidak ditemukan atau sudah kedaluwarsa.');
  if(user.otp_code.startsWith('verified:')) throw new Error('Kode OTP sudah digunakan.');
  if(hash(code)!==user.otp_code) throw new Error('Kode OTP salah.');
  const marker=makeVerificationMarker(code);
  const {error}=await db.from('users').update({otp_code:marker,otp_expires_at:new Date(Date.now()+VERIFY_TTL_MS).toISOString(),updated_at:new Date().toISOString()}).eq('id',user.id).eq('otp_code',user.otp_code);
  if(error) throw new Error('Verifikasi OTP gagal.');
  return marker;
}

async function completeWithMarker(db,email,purpose,verificationToken){
  const user=await requireUser(db,email);
  if(!verificationToken||!user.otp_code||!user.otp_code.startsWith('verified:')||user.otp_code!==verificationToken) throw new Error('Token verifikasi tidak valid atau sudah kedaluwarsa.');
  if(!user.otp_expires_at||Date.now()>new Date(user.otp_expires_at).getTime()) throw new Error('Token verifikasi sudah kedaluwarsa.');
  return user;
}

async function consumeVerification(db,user){
  const {error}=await db.from('users').update({otp_code:null,otp_expires_at:null,updated_at:new Date().toISOString()}).eq('id',user.id).eq('otp_code',user.otp_code);
  if(error) throw new Error('Token verifikasi tidak dapat digunakan.');
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Accept');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method Not Allowed'});
  try{
    const b=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});
    const action=String(b.action||'');
    const email=cleanEmail(b.email);
    const purpose=String(b.purpose||'');
    const db=admin();
    if(!email.includes('@')||!['registration','password_reset','password_change'].includes(purpose))return res.status(400).json({success:false,error:'Permintaan OTP tidak valid.'});

    if(action==='request'){
      let user;
      if(purpose==='registration') user=await ensureRegistrationUser(db,email,Date.now());
      else user=await requireUser(db,email);
      const code=otp();
      await saveOtp(db,user,code,Date.now());
      await sendOtpEmail(email,code,purpose);
      return res.status(200).json({success:true,message:'OTP berhasil dikirim.',expiresInSeconds:600});
    }

    if(action==='verify'){
      const code=String(b.code||'').replace(/\D/g,'');
      if(!/^\d{6}$/.test(code))return res.status(400).json({success:false,error:'OTP harus 6 digit.'});
      const verificationToken=await verifyCode(db,email,code);
      return res.status(200).json({success:true,verificationToken,message:'OTP terverifikasi.'});
    }

    if(action==='complete_registration'){
      const v=String(b.verificationToken||'');
      const user=await completeWithMarker(db,email,'registration',v);
      const name=String(b.name||'').trim();
      const storeName=String(b.storeName||'').trim();
      const phone=String(b.phone||'').trim();
      const region=String(b.region||'').trim();
      const district=String(b.district||'').trim();
      const password=String(b.password||'');
      if(name.length<2||storeName.length<2||!phone||!region||!district||password.length<5||password.length>128)throw new Error('Data pendaftaran tidak lengkap.');
      const current=await getUserByEmail(db,email);
      if(!current||current.id!==user.id)throw new Error('Data pendaftaran tidak ditemukan.');
      const {error}=await db.from('users').update({name,store_name:storeName,email,phone,region,district,password,is_verified:true,status:'active',deleted_at:null,updated_at:new Date().toISOString(),otp_code:null,otp_expires_at:null}).eq('id',user.id).eq('otp_code',v);
      if(error)throw new Error('Akun gagal dibuat.');
      return res.status(200).json({success:true,user:{id:user.id,name,storeName,email,phone,region,district,isVerified:true}});
    }

    if(action==='reset_password'||action==='change_password'){
      const newPassword=String(b.newPassword||'');
      const v=String(b.verificationToken||'');
      if(newPassword.length<5||newPassword.length>128)return res.status(400).json({success:false,error:'Password harus 5-128 karakter.'});
      const user=await completeWithMarker(db,email,purpose,v);
      const {error}=await db.from('users').update({password:newPassword,is_verified:true,updated_at:new Date().toISOString(),otp_code:null,otp_expires_at:null}).eq('id',user.id).eq('otp_code',v);
      if(error)throw new Error('Password gagal diperbarui.');
      return res.status(200).json({success:true,message:'Password berhasil diperbarui.'});
    }

    return res.status(400).json({success:false,error:'Aksi OTP tidak dikenali.'});
  }catch(e){
    console.error('[OTP Server Error]',{name:e.name,code:e.code,message:e.message});
    const status=/tidak ditemukan|sudah kedaluwarsa|salah|Tunggu|Terlalu banyak|tidak valid|sudah terdaftar|tidak lengkap|sudah digunakan|ditangguhkan/i.test(e.message)?400:500;
    return res.status(status).json({success:false,error:e.message||'OTP service error.'});
  }
}
