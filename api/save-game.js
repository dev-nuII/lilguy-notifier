const {
  resolveSaveCode,
  isDevRequest,
  setSaveCodeCookie,
  generateSaveCode,
  setCorsHeaders,
} = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

const ALLOWED_FIELDS = [
  "mental_state", "mood", "hp", "x_pos", "y_pos", "last_open_date", "streak",
  "bond", "animation", "last_hunger_check", "hunger", "pets_today",
  "last_pet_str", "weather", "save_num", "highest_bond",
  "unlocked_tiers", "seen_first_snow", "userIp", "isBossfight", "username",
  // ---- RPG stats ---- ("gear" deliberately excluded: only cron/raid
  // endpoints that roll gear server-side may write it, never the client.
  "level", "max_hp", "dmg", "recovery_seconds",
  "unlocked_levels", "last_regen_at",
];

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const data = req.body;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid save data" });
    }

    const dev = isDevRequest(req);
    // Dev â "dev". Prod â validated cookie code, or a fresh code if missing/invalid.
    const code = resolveSaveCode(req) || generateSaveCode();

    const clean = { save_code: code };
    for (const key of ALLOWED_FIELDS) if (key in data) clean[key] = data[key];
    if ("hunger" in clean) clean.hunger = Math.min(20, Math.max(0, Number(clean.hunger) || 0));

    const fbResp = await fetch(`${FIREBASE_URL}/saves/${code}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
    if (!fbResp.ok) throw new Error("Firebase returned " + fbResp.status);

    if (!dev) setSaveCodeCookie(res, code);

    return res.status(200).json({ success: true, saveCode: code });
  } catch (error) {
    console.error("save-game error:", error);
    return res.status(500).json({ error: "Failed to save game" });
  }
};
