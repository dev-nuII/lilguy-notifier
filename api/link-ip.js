const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
function sanitizeIpKey(ip) {
  return ip.replace(/[.:]/g, "_");
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://dev-nuii.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const myIpKey = sanitizeIpKey(getClientIp(req));
    const mapResp = await fetch(`${FIREBASE_URL}/ip_map/${myIpKey}.json?auth=${FIREBASE_SECRET}`);
    const mySaveKey = await mapResp.json();

    if (!mySaveKey) {
      return res.status(400).json({ error: "You don't have a save yet — load the game once first." });
    }

    const { newIp } = req.body || {};
    if (!newIp) return res.status(400).json({ error: "Missing newIp in request body" });

    const newIpKey = sanitizeIpKey(newIp);
    await fetch(`${FIREBASE_URL}/ip_map/${newIpKey}.json?auth=${FIREBASE_SECRET}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mySaveKey),
    });

    return res.status(200).json({ success: true, linkedTo: mySaveKey });
  } catch (error) {
    console.error("link-ip error:", error);
    return res.status(500).json({ error: "Failed to link IP" });
  }
};
