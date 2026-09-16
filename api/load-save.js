const {
  getSaveCodeFromReq,
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

async function createNewSave() {
  // Astronomically unlikely to collide, but check anyway before claiming a code.
  let code, existing;
  do {
    code = generateSaveCode();
    existing = await fetchSave(code);
  } while (existing);

  const defaultSave = {
    mental_state: "neutral",
    mood: 2,
    event_running: false,
    hp: 5,
    lilguy2_0: false,
    one: 0,
    change_change: 0,
    changevar: 1,
    x_pos: 180,
    y_pos: 0,
    x1_pos: 0,
    last_open_date: new Date().toISOString().slice(0, 10),
    streak: 0,
    bond: 0,
    animation: 0,
    last_hunger_check: new Date().toISOString(),
    hunger: 20,
    machine_id: "web-client",
    pets_today: 8,
    last_pet_str: new Date().toISOString(),
    weather: "clear",
    save_num: 0,
    // Stored on the save itself (not just handed out as a cookie) so the
    // code travels with the record and can never get lost even if the
    // cookie is cleared, the browser is switched, etc.
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
    const cookieCode = getSaveCodeFromReq(req);
    let code = cookieCode;
    let save = cookieCode ? await fetchSave(cookieCode) : null;

    if (!save) {
      // No cookie yet, or the cookie pointed at a save that no longer
      // exists in Firebase — mint a fresh save + code for this browser.
      const created = await createNewSave();
      code = created.code;
      save = created.save;
    } else if (!save.save_code) {
      // Backfills a save created before save_code was stored on the record
      // itself, so it doesn't silently stay "lost" going forward.
      save.save_code = code;
      await fetch(`${FIREBASE_URL}/saves/${code}/save_code.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(code),
      });
    }

    // Re-issue the cookie on every load to keep sliding the expiry forward
    // and to make sure it's set at all on a brand-new browser.
    setSaveCodeCookie(res, code);

    delete save.vapid_private_key; // never send this to the browser

    return res.status(200).json({ save, saveCode: code });
  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
