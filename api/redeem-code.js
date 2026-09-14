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
    const { code, deviceId } = req.body || {};
    if (!code) return res.status(400).json({ error: "Missing code" });

    const normalizedCode = code.trim().toUpperCase();
    const lookupResp = await fetch(
      `${FIREBASE_URL}/recovery_codes/${normalizedCode}.json?auth=${FIREBASE_SECRET}`
    );
    const saveKey = await lookupResp.json();

    if (!saveKey) {
      return res.status(404).json({ error: "Code not recognized" });
    }

    const ipKey = sanitizeIpKey(getClientIp(req));

    // link this visitor's IP (fallback) and deviceId (source of truth) to that save
    const writes = [
      fetch(`${FIREBASE_URL}/ip_map/${ipKey}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveKey),
      }),
    ];
    if (deviceId) {
      writes.push(
        fetch(`${FIREBASE_URL}/device_map/${deviceId}.json?auth=${FIREBASE_SECRET}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveKey),
        })
      );
    }
    await Promise.all(writes);

    const saveResp = await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`);
    const save = await saveResp.json();

    return res.status(200).json({ success: true, save, saveKey });
  } catch (error) {
    console.error("redeem-code error:", error);
    return res.status(500).json({ error: "Failed to redeem code" });
  }
};
