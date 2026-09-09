const webpush = require("web-push");

const FIREBASE_URL = process.env.FIREBASE_URL;
const SAVE_ID = process.env.SAVE_ID;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:you@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // JS months are 0-indexed
  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "fall";
}

// same rate tables as the Python script's season_modifers / weather multipliers
const seasonRates = { winter: 1.25, spring: 1.0, summer: 0.9, fall: 1.0 };
const weatherRates = { rain: 1.1, storm: 1.15, snow: 1.2 };

module.exports = async function handler(req, res) {
  try {
    const saveResp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`);
    const save = await saveResp.json();

    if (!save) {
      res.status(200).json({ status: "no save data found" });
      return;
    }

    const seasonMult = seasonRates[getCurrentSeason()];
    const weatherMult = weatherRates[save.weather] ?? 1.0;

    let hunger = save.hunger ?? 20;
    if (save.last_hunger_check) {
      const lastCheck = new Date(save.last_hunger_check);
      const hoursPassed = (Date.now() - lastCheck.getTime()) / 3600000;
      hunger = Math.max(0, hunger - Math.floor(hoursPassed) * seasonMult * weatherMult);
    }

    // write the corrected hunger back — PATCH only touches these two fields
    const nowIso = new Date().toISOString();
    await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hunger: hunger,
        last_hunger_check: nowIso,
      }),
    });

    if (hunger >= 10) {
      res.status(200).json({ status: "not hungry yet", hunger });
      return;
    }

    const lastNotified = save.last_notified ? new Date(save.last_notified) : null;
    const hoursSinceNotified = lastNotified ? (Date.now() - lastNotified.getTime()) / 3600000 : 999;
    if (hoursSinceNotified < 6) {
      res.status(200).json({ status: "already notified recently", hunger });
      return;
    }

    const subResp = await fetch(`${FIREBASE_URL}/push_subscription.json`);
    const subscription = await subResp.json();
    if (!subscription) {
      res.status(200).json({ status: "no push subscription saved" });
      return;
    }

    const payload = JSON.stringify({
      title: "Lil Guy",
      body: `He's hungry! Hunger is at ${Math.round(hunger)}.`,
    });
    await webpush.sendNotification(subscription, payload);

    await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last_notified: new Date().toISOString() }),
    });

    res.status(200).json({ status: "notification sent", hunger });
  } catch (e) {
    console.log("check-hunger error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
};
