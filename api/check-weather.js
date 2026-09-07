const webpush = require("web-push");

// These come from environment variables (set in the Vercel dashboard,
// not written in this file) — similar to how you'd use os.environ.get()
// in Python instead of hardcoding a secret in the script.
const FIREBASE_URL = process.env.FIREBASE_URL;       // e.g. https://hhff-88ec0-default-rtdb.firebaseio.com
const SAVE_ID = process.env.SAVE_ID;                  // e.g. lilguy_var0
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:you@example.com", // Vercel/push spec requires a contact string here, doesn't need to be real
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);
async function getLocationFromIP(ip = "") {
  const response = await fetch(
    `https://ipapi.co/${ip}/json/`
  );

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.reason || "Could not locate IP");
  }

  return {
    ip: data.ip,
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city,
    country: data.country_name
  };
}

async function fetchWeather() {
  const saveResp1 = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`);
  const save1 = await saveResp1.json();
  const { latitude, longitude } = await getLocationFromIP(save1.userIp);
  let lat = latitude, lon = longitude;
  let code = null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const resp = await fetch(url);
    const data = await resp.json();
    code = data.current_weather.weathercode;
  } catch (e) {
    console.log("weather lookup failed:", e);
  }

  let weather;
  if (code === 0) weather = "clear";
  else if ([1, 2, 3].includes(code)) weather = "cloudy";
  else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) weather = "rain";
  else if ([71, 73, 75, 77, 85, 86].includes(code)) weather = "snow";
  else if ([95, 96, 99].includes(code)) weather = "storm";
  else weather = "clear";
  return { weather };
}

// module.exports = ... is JS's version of Python's "if __name__ == '__main__':"
// entry point — this is the function Vercel actually calls when the URL is hit.
module.exports = async function handler(req, res) {
  try {
    const saveResp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`);
    const save = await saveResp.json();

    if (!save) {
      res.status(200).json({ status: "no save data found" });
      return;
    }

    const { weather } = await fetchWeather();
    const last_seen_weather = save.last_seen_weather;
    const weatherChanged = last_seen_weather !== undefined && last_seen_weather !== weather;

    await fetch(`${FIREBASE_URL}/${SAVE_ID}/last_seen_weather.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weather),
    });

    if (!weatherChanged) {
      res.status(200).json({ status: "weather unchanged", weather });
      return;
    }

    const lastNotified1 = save.last_notified1 ? new Date(save.last_notified1) : null;
    const hoursSinceNotified1 = lastNotified1 ? (Date.now() - lastNotified1.getTime()) / 3600000 : 999;
    if (hoursSinceNotified1 < 2) {
      res.status(200).json({ status: "changed, but notified recently", weather });
      return;
    }

    const subResp1 = await fetch(`${FIREBASE_URL}/push_subscription.json`);
    const subscription1 = await subResp1.json();
    if (!subscription1) {
      res.status(200).json({ status: "no push subscription saved" });
      return;
    }

    const payload1 = JSON.stringify({
      title: "Lil Guy",
      body: "Weather in your area has changed!",
    });
    await webpush.sendNotification(subscription1, payload1);

    await fetch(`${FIREBASE_URL}/${SAVE_ID}/last_notified1.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(new Date().toISOString()),
    });

    res.status(200).json({ status: "notification sent", weather });
  } catch (e) {
    console.log("check-weather error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
};
