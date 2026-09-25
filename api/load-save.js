const {
  isDevRequest,
  resolveSaveCode,
  DEV_SAVE_KEY,
  setSaveCodeCookie,
  generateSaveCode,
  setCorsHeaders,
} = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

async function fetchSave(code) {
  const resp = await fetch(`${FIREBASE_URL}/saves/${code}.json?auth=${FIREBASE_SECRET}`);
  return await resp.json(); // null if that save doesn't exist
}

// fixedCode = "dev" in dev mode; otherwise mint a fresh unique code.
async function createNewSave(fixedCode) {
  let code = fixedCode;
  if (!code) {
    let existing;
    do {
      code = generateSaveCode();
      existing = await fetchSave(code);
    } while (existing);
  }

  const now = new Date().toISOString();
  const defaultSave = {
    mental_state: "neutral",
    mood: 2,
    hp: 5,
    level: 0,
    max_hp: 5,
    dmg: 1,
    recovery_seconds: 600,
    gear: [],
    unlocked_levels: [],
    last_regen_at: Date.now(),
    idle_happy_seconds: 0,
    last_idle_check: now,
    x_pos: 180,
    y_pos: 0,
    last_open_date: now.slice(0, 10),
    streak: 0,
    bond: 0,
    animation: 0,
    last_hunger_check: now,
    hunger: 20,
    pets_today: 8,
    last_pet_str: now,
    weather: "clear",
    save_num: 0,
    // Stored on the save itself so the code travels with the record.
    save_code: code,
  };

  await fetch(`${FIREBASE_URL}/saves/${code}.json?auth=${FIREBASE_SECRET}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(defaultSave),
  });

  return { code, save: defaultSave };
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "GET, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const dev = isDevRequest(req);
    let code = resolveSaveCode(req);
    let save = code ? await fetchSave(code) : null;

    if (!save) {
      // Dev: create the "dev" save once. Prod: no cookie (or stale cookie),
      // so mint a fresh save + code for this browser.
      const created = await createNewSave(dev ? DEV_SAVE_KEY : null);
      code = created.code;
      save = created.save;
    } else if (!save.save_code) {
      // Backfill saves created before save_code was stored on the record.
      save.save_code = code;
      await fetch(`${FIREBASE_URL}/saves/${code}/save_code.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(code),
      });
    }

    // Prod re-issues the cookie on every load to slide the expiry forward.
    // Dev ignores cookies entirely.
    if (!dev) setSaveCodeCookie(res, code);

    delete save.vapid_private_key; // never send this to the browser

    return res.status(200).json({ save, saveCode: code });
  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
