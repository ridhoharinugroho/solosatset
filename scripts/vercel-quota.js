// scripts/vercel-quota.js
// Run with `node scripts/vercel-quota.js`
// This script uses the Vercel CLI to list recent deployments,
// filters those within the last 24 hours, and prints a summary.

import { execSync } from "child_process";

function parseTime(token) {
  if (token.endsWith("m")) return parseInt(token);
  if (token.endsWith("h")) return parseInt(token) * 60;
  if (token.endsWith("d")) return parseInt(token) * 24 * 60;
  return null;
}

function getDeployments() {
  try {
    const raw = execSync("vercel ls --limit 100 --no-color", { encoding: "utf8" });
    const lines = raw.split(/\r?\n/);
    const deployments = lines.filter((line) => {
      const trimmed = line.trim();
      return trimmed.includes("ridho18/solosatset") && /\d+[mhd]/.test(trimmed);
    });
    console.log(`Debug: total lines ${lines.length}, matched ${deployments.length}`);
    return deployments;
  } catch (e) {
    console.error("Failed to run `vercel list`. Ensure Vercel CLI is installed and logged in.");
    return [];
  }
}

function isWithin24h(line) {
  const parts = line.trim().split(/\s+/);
  const timeToken = parts.find((part) => /\d+[mhd]/.test(part));
  const minutes = parseTime(timeToken);
  // Filter for entries within 24 hours (1440 minutes)
  return minutes !== null && minutes <= 1440;
}

function summarize(lines) {
  let total = 0,
    ready = 0,
    error = 0,
    prod = 0,
    preview = 0;
  for (const line of lines) {
    if (!isWithin24h(line)) continue;
    total++;
    if (/●\s+Ready/.test(line)) ready++;
    if (/●\s+Error/.test(line)) error++;
    if (/Production/.test(line)) prod++;
    if (/Preview/.test(line)) preview++;
  }
  const quota = 100; // free plan daily deployment limit
  const remaining = Math.max(quota - total, 0);
  console.log("=== Vercel Deployment Stats (last 24h) ===");
  console.log(`Total deployments   : ${total}`);
  console.log(`✅ Ready (sukses)  : ${ready}`);
  console.log(`❌ Error (gagal)   : ${error}`);
  console.log(`🚀 Production      : ${prod}`);
  console.log(`👁️ Preview        : ${preview}`);
  console.log(`Quota (free)       : ${quota} per day`);
  console.log(`Remaining quota    : ${remaining} deployments`);
}

const deployments = getDeployments();
summarize(deployments);
