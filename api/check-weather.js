const webpush = require("web-push");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function getLocationFromIP(ip) {
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const data = await response.json();
  if (data.status === "fail") throw new Error(data.message || "Could not locate IP");
  return { latitude: data.lat, longitude: data.lon };
}

async function fetchWeatherForIp(ip) {
  let lat = 0, lon = 0;
  try {
    const loc = await getLocationFromIP(ip);
    lat = loc.latitude;
    lon = loc.longitude;
  } catch (e) {
    console.log("location lookup failed:", e);
  }

  let code = null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const resp = await fetch(url);
    const data = await resp.json();
    code = data.current_weather.weathercode;
  } catch (e) {
    console.log("weather lookup failed:", e);
  }

  if (code === 0) return "clear";
  if ([1, 2, 3].includes(code)) return "cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "clear";
}

module.exports = async function handler(req, res) {
  try {
    const allSavesResp = await fetch(`${FIREBASE_URL}/saves.json?auth=${FIREBASE_SECRET}`);
    const allSaves = await allSavesResp.json();

    if (!allSaves) {
      return res.status(200).json({ status: "no saves found" });
    }

    const results = [];

    for (const [saveKey, save] of Object.entries(allSaves)) {
      try {
        if (!save.userIp) {
          results.push({ saveKey, status: "no userIp on this save" });
          continue;
        }

        const weather = await fetchWeatherForIp(save.userIp);
        const lastSeenWeather = save.last_seen_weather;
        const weatherChanged = lastSeenWeather !== undefined && lastSeenWeather !== weather;

        await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weather, last_seen_weather: weather }),
        });

        if (!weatherChanged) {
          results.push({ saveKey, status: "weather unchanged", weather });
          continue;
        }

        const lastNotified1 = save.last_notified1 ? new Date(save.last_notified1) : null;
        const hoursSince = lastNotified1 ? (Date.now() - lastNotified1.getTime()) / 3600000 : Infinity;
        if (hoursSince < 2) {
          results.push({ saveKey, status: "changed, but notified recently", weather });
          continue;
        }

        const subscription = save.subscription;
        if (!subscription) {
          results.push({ saveKey, status: "no subscription for this save", weather });
          continue;
        }

        await webpush.sendNotification(subscription, JSON.stringify({
          title: "Lil Guy",
          body: "Weather in your area has changed!",
        }));

        await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ last_notified1: new Date().toISOString() }),
        });

        results.push({ saveKey, status: "notification sent", weather });
      } catch (innerError) {
        console.error(`check-weather error for ${saveKey}:`, innerError);
        results.push({ saveKey, status: "error", message: innerError.message });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("check-weather error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
