const { randomInt } = require("crypto");
// lib/cookies.js
// Shared helpers for the cookie-based save-code auth system.
// This file lives outside /api so Vercel doesn't turn it into its own route —
// it's just a normal module the api/*.js handlers require().

const SAVE_CODE_COOKIE = "lilguy_save_code";
const SAVE_CODE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years, in seconds

// The frontend (index.html) and this API are deployed together as one
// Vercel project now, so every request is same-origin. That means a plain
// SameSite=Lax cookie works fine and — importantly — won't get blocked by
// third-party cookie protections the way a cross-site SameSite=None cookie
// would (Safari in particular blocks those unconditionally, which is what
// broke saves/notifications when the frontend lived on GitHub Pages).
function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(val);
    } catch (e) {
      cookies[key] = val;
    }
  });
  return cookies;
}
const SAVE_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function isValidSaveCode(code) {
  return typeof code === "string" && SAVE_CODE_RE.test(code);
}
function getSaveCodeFromReq(req) {
  return parseCookies(req)[SAVE_CODE_COOKIE] || null;
  return isValidSaveCode(code) ? code : null;
}

function setSaveCodeCookie(res, code) {
  const cookie = `${SAVE_CODE_COOKIE}=${encodeURIComponent(code)}; Max-Age=${SAVE_CODE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookie]);
  } else {
    res.setHeader("Set-Cookie", [existing, cookie]);
  }
}

// Same shape/format as the old recovery codes (e.g. "ABCD-EFGH-JKLM") — this
// is now used directly as the save's key in Firebase (/saves/{code}), so it
// doubles as the "username" for that save.
function generateSaveCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if ((i + 1) % 4 === 0 && i !== 11) code += "-";
  }
  return code;
}

// Frontend + API are same-origin now, so real browsers don't even run CORS
// checks on these requests. We still set permissive-but-safe headers so the
// endpoints keep working if hit directly (curl, a preview deployment URL,
// local testing, etc.) — reflecting the request's own Origin rather than a
// hardcoded one means this doesn't need updating if the domain ever changes.
const ALLOWED_ORIGINS = ["https://lilguynotifications.vercel.app"];  // add your real domain(s)

function setCorsHeaders(res, methods, req) {
  const origin = req && req.headers && req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
module.exports = {
  SAVE_CODE_COOKIE,
  parseCookies,
  getSaveCodeFromReq,
  setSaveCodeCookie,
  generateSaveCode,
  setCorsHeaders,
};
