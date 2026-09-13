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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const ipKey = sanitizeIpKey(getClientIp(req));

    const mapResp = await fetch(`${FIREBASE_URL}/ip_map/${ipKey}.json?auth=${FIREBASE_SECRET}`);
    let saveKey = await mapResp.json();

    if (!saveKey) {
  saveKey = "save_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await fetch(`${FIREBASE_URL}/ip_map/${ipKey}.json?auth=${FIREBASE_SECRET}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(saveKey),
  });

  // new: give this save a recovery code, stored both directions
  const recoveryCode = generateRecoveryCode();
  await fetch(`${FIREBASE_URL}/recovery_codes/${recoveryCode}.json?auth=${FIREBASE_SECRET}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(saveKey),
  });
  await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recovery_code: recoveryCode }),
  });
}

    const saveResp = await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`);
    const save = await saveResp.json();

    return res.status(200).json({ save, saveKey });
  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
