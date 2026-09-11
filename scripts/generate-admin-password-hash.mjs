#!/usr/bin/env node
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-admin-password-hash.mjs "<new-password>"');
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keyLength = 64;
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, keyLength, {
  N,
  r,
  p,
  maxmem: 128 * N * r + 1024 * 1024,
});

console.log(`scrypt$${salt.toString("base64url")}$${key.toString("base64url")}$${N},${r},${p}`);
