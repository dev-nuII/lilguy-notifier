const webpush = require("web-push");

const FIREBASE_URL = process.env.FIREBASE_URL;
const SAVE_ID = process.env.SAVE_ID;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "fall";
}
const seasonRates = { winter: 1.25, spring: 1.0, summer: 0.9, fall: 1.0 };
const weatherRates = { rain: 1.1, storm: 1.15, snow: 1.2 };

module.exports = async function handler(req, res) {
  try {
    const saveResp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json?auth=${FIREBASE_SECRET}`);
    const save = await saveResp.json();
    if (!save) return res.status(200).json({ status: "no save data found" });

    const seasonMult = seasonRates[getCurrentSeason()] ?? 1.0;
    const weatherMult = weatherRates[save.weather] ?? 1.0;

    let hunger = save.hunger ?? 20;
    if (save.last_hunger_check) {
      const lastCheck = new Date(save.last_hunger_check);
      const hoursPassed = (Date.now() - lastCheck.getTime()) / 3600000;
      hunger = Math.max(0, hunger - Math.floor(hoursPassed) * seasonMult * weatherMult);
    }

    await fetch(`${FIREBASE_URL}/${SAVE_ID}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hunger, last_hunger_check: new Date().toISOString() }),
    });

    if (hunger >= 10) return res.status(200).json({ status: "not hungry yet", hunger });

    const lastNotified = save.last_notified ? new Date(save.last_notified) : null;
    const hoursSinceNotified = lastNotified ? (Date.now() - lastNotified.getTime()) / 3600000 : Infinity;
    if (hoursSinceNotified < 6) return res.status(200).json({ status: "already notified recently", hunger });

    const subResp = await fetch(`${FIREBASE_URL}/push_subscription.json?auth=${FIREBASE_SECRET}`);
    const subscription = await subResp.json();
    if (!subscription) return res.status(200).json({ status: "no push subscription saved" });

    const payload = JSON.stringify({ title: "Lil Guy", body: `He's hungry! Hunger is at ${Math.round(hunger)}.` });
    await webpush.sendNotification(subscription, payload);

    await fetch(`${FIREBASE_URL}/${SAVE_ID}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ last_notified: new Date().toISOString() }),
    });

    return res.status(200).json({ status: "notification sent", hunger });
  } catch (error) {
    console.error("check-hunger error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
