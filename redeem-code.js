const { setSaveCodeCookie, setCorsHeaders } = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: "Missing code" });

    const normalizedCode = code.trim().toUpperCase();

    // Same URL mapping used everywhere else — the save code IS the Firebase
    // key, so "does this code match any save" is just "does this key exist".
    const saveResp = await fetch(`${FIREBASE_URL}/saves/${normalizedCode}.json?auth=${FIREBASE_SECRET}`);
    const save = await saveResp.json();

    if (!save) {
      return res.status(404).json({ error: "Code not recognized" });
    }

    // Match found — generate/point this browser's cookie at that save code.
    setSaveCodeCookie(res, normalizedCode);

    delete save.vapid_private_key;

    return res.status(200).json({ success: true, save, saveCode: normalizedCode });
  } catch (error) {
    console.error("redeem-code error:", error);
    return res.status(500).json({ error: "Failed to redeem code" });
  }
};
