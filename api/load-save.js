const webpush = require('web-push');
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

// IP addresses are not a reliable identity key on mobile: carrier NAT pools
// and iCloud Private Relay can change a phone's apparent IP between two
// requests seconds apart. We link BOTH the IP (legacy fallback) and the
// client-generated deviceId (source of truth) to the save every time we can,
// so the mapping self-heals even if it was first created without a deviceId.
async function linkIdentifiersToSave(ipKey, deviceId, saveKey) {
  const now = new Date().toISOString();
  const writes = [
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
  ];
  if (deviceId) {
    writes.push(
      fetch(`${FIREBASE_URL}/device_map/${deviceId}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveKey),
      }),
      fetch(`${FIREBASE_URL}/saves/${saveKey}/linked_devices/${deviceId}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(now),
      })
    );
  }
  await Promise.all(writes);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://dev-nuii.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const ipKey = sanitizeIpKey(getClientIp(req));
    const deviceId = req.query && req.query.deviceId ? String(req.query.deviceId).slice(0, 64) : null;

    let saveKey = null;

    if (deviceId) {
      const devResp = await fetch(`${FIREBASE_URL}/device_map/${deviceId}.json?auth=${FIREBASE_SECRET}`);
      saveKey = await devResp.json();
    }
    if (!saveKey) {
      // Legacy fallback for clients that haven't picked up a deviceId yet.
      const mapResp = await fetch(`${FIREBASE_URL}/ip_map/${ipKey}.json?auth=${FIREBASE_SECRET}`);
      saveKey = await mapResp.json();
    }

    if (!saveKey) {
      saveKey = "save_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

      const recoveryCode = generateRecoveryCode();
      await fetch(`${FIREBASE_URL}/recovery_codes/${recoveryCode}.json?auth=${FIREBASE_SECRET}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveKey),
      });
      const vapidKeys = webpush.generateVAPIDKeys();

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

    }

    // Always (re)link both identifiers to whatever save we ended up with.
    // This is what lets the mapping self-heal: even if this request's IP
    // never had an ip_map entry, once we know the deviceId->saveKey pairing
    // is right, we pin it — so future requests find the save via deviceId
    // regardless of what IP they come in on.
    await linkIdentifiersToSave(ipKey, deviceId, saveKey);

    const saveResp = await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`);
const save = await saveResp.json();

if (save) delete save.vapid_private_key; // never send this to the browser

return res.status(200).json({ save, saveKey });  } catch (error) {
    console.error("load-save error:", error);
    return res.status(500).json({ error: "Failed to load save" });
  }
};
