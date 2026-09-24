const { resolveSaveCode, setCorsHeaders } = require("../lib/cookies");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

module.exports = async function handler(req, res) {
  setCorsHeaders(res, "POST, OPTIONS", req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid push subscription" });
    }

    // Dev → "dev". Prod → validated cookie code (null if none yet).
    const code = resolveSaveCode(req);
    if (!code) {
      return res.status(400).json({ error: "No save found for this device yet — load the game first." });
    }

    const fbResp = await fetch(`${FIREBASE_URL}/saves/${code}/subscription.json?auth=${FIREBASE_SECRET}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!fbResp.ok) throw new Error("Firebase returned " + fbResp.status);

    return res.status(200).json({ success: true, saveCode: code });
  } catch (error) {
    console.error("save-push error:", error);
    return res.status(500).json({ error: "Failed to save subscription" });
  }
};
