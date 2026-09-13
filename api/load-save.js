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

function generateRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if ((i + 1) % 4 === 0 && i !== 11) code += "-";
  }
  return code;
}

async function linkIpToSave(ipKey, saveKey) {
  const now = new Date().toISOString();
  await Promise.all([
    fetch(`${FIREBASE_URL}/ip_map/${ipKey}.json?auth=${FIREBASE_SECRET}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saveKey),
    }),
    fetch(`${FIREBASE_URL}/saves/${saveKey}/linked_ips/${ipKey}.json?auth=${FIREBASE_SECRET}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(now),
    }),
  ]);
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

      const recoveryCode = generateRecoveryCode();
      await fetch(`${FIREBASE_URL}/recovery_codes/${recoveryCode}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveKey),
      });

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
        recovery_code: recoveryCode,
      };

      await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultSave),
      });

      await linkIpToSave(ipKey, saveKey);
    }

    const saveResp = await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`);
    const save = await saveResp.json();

    return res.status(200).json({ save, saveKey });
  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
