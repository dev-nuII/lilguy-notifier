// lib/cookies.js
// Shared helpers for the cookie-based save-code auth system, plus dev-mode detection.
// This file lives outside /api so Vercel doesn't turn it into its own route —
// it's just a normal module the api/*.js handlers require().

const SAVE_CODE_COOKIE = "lilguy_save_code";
const SAVE_CODE_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years, in seconds

// ---------- DEV MODE ----------
// The dev deployment (a separate Vercel project) always uses one shared save
// and ignores cookies. Dev is detected by either:
//   1. the DEV_MODE=true env var on the dev Vercel project (preferred), or
//   2. the request's hostname being in DEV_HOSTS (fallback, no env var needed).
const DEV_SAVE_KEY = "dev";
const DEV_HOSTS = ["https://lilguy-dev.vercel.app"]; // hostnames only, no https://

function isDevRequest(req) {
  if (process.env.DEV_MODE === "true") return true;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(":")[0]
    .toLowerCase();
  return DEV_HOSTS.includes(host);
}

// The frontend (index.html) and this API are deployed together as one
// Vercel project, so every request is same-origin. A plain SameSite=Lax
// cookie works fine and won't get blocked by third-party cookie protections.
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

// Prod: the validated cookie value, or null.
function getSaveCodeFromReq(req) {
  const code = parseCookies(req)[SAVE_CODE_COOKIE] || null;
  return isValidSaveCode(code) ? code : null;
}

// Dev: always "dev" (cookies ignored). Prod: the validated cookie, or null.
function resolveSaveCode(req) {
  return isDevRequest(req) ? DEV_SAVE_KEY : getSaveCodeFromReq(req);
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

// Format e.g. "ABCD-EFGH-JKLM" — used directly as the save's key in
// Firebase (/saves/{code}), so it doubles as the "username" for that save.
function generateSaveCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if ((i + 1) % 4 === 0 && i !== 11) code += "-";
  }
  return code;
}

// Same-origin requests don't need CORS, but we still set safe headers so the
// endpoints work if hit directly (curl, preview URLs, local testing).
const ALLOWED_ORIGINS = ["https://lilguynotifications.vercel.app"]; // add your real domain(s), incl. dev

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
  DEV_SAVE_KEY,
  parseCookies,
  getSaveCodeFromReq,
  isValidSaveCode,
  isDevRequest,
  resolveSaveCode,
  setSaveCodeCookie,
  generateSaveCode,
  setCorsHeaders,
};
