// api/lilguy-sleep-now.js
// User-triggered sleep: called by the client (js/functions/browserSleep.js)
// when the player taps "goodnight". Puts THIS save to sleep for 8 hours.
// Distinct from api/lilguy-sleep.js, which is the hourly cron job that
// randomly naps every save and wakes anyone whose timer is up.

const {
  resolveSaveCode,
  setCorsHeaders,
} = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

const TZ = "America/Chicago";
const SLEEP_DURATION_MS = 8 * 60 * 60 * 1000;

function toLocal(iso) {
  return new Date(iso).toLocaleString("en-US", { timeZone: TZ });
}

function toLocalDateStr(ms) {
  // YYYY-MM-DD in the target TZ, for the "already slept today" check
  const d = new Date(ms);
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const code = resolveSaveCode(req);
    if (!code) return res.status(401).json({ error: "No save found" });

    const now = Date.now();
    const wakeAt = now + SLEEP_DURATION_MS;
    const todayStr = toLocalDateStr(now);

    const fbResp = await fetch(`${FIREBASE_URL}/saves/${code}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sleeping: true,
        sleep_wake_at: wakeAt,
        sleep_wake_at_local: toLocal(new Date(wakeAt).toISOString()),
        slept_today: todayStr,
        stop_hunger_check: true,
      }),
    });
    if (!fbResp.ok) throw new Error("Firebase returned " + fbResp.status);

    return res.status(200).json({ success: true, sleep_wake_at: wakeAt, slept_today: todayStr });
  } catch (error) {
    console.error("lilguy-sleep-now error:", error);
    return res.status(500).json({ error: "Failed to put lilguy to sleep" });
  }
};
