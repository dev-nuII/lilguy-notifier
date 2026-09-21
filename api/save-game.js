const { getSaveCodeFromReq, setSaveCodeCookie, generateSaveCode, setCorsHeaders } = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const data = req.body;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid save data" });
    }

    // The client always hits /api/load-save on startup first, so the cookie
    // should already be set — but fall back to minting one here too so a
    // save is never silently dropped if this somehow gets called first.
    const code = getSaveCodeFromReq(req) || generateSaveCode();

    // This is a full overwrite (PUT) of /saves/{code}, so re-stamp save_code
    // into the payload every time — otherwise it would get wiped out on the
    // very next save instead of staying attached to the record.
    data.save_code = code;

    await fetch(`${FIREBASE_URL}/saves/${code}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaveCodeCookie(res, code);

    return res.status(200).json({ success: true, saveCode: code });
  } catch (error) {
    console.error("save-game error:", error);
    return res.status(500).json({ error: "Failed to save game" });
  }
};
