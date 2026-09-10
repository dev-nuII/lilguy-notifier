 const FIREBASE_URL = process.env.FIREBASE_URL;
const SAVE_ID = process.env.SAVE_ID;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://dev-nuii.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const resp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json?auth=${FIREBASE_SECRET}`);
    const save = await resp.json();
    return res.status(200).json({ save });
  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
