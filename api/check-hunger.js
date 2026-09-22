const webpush = require("web-push");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const TZ = "America/Chicago";

function toLocal(iso) {
  return new Date(iso).toLocaleString("en-US", { timeZone: TZ });
}

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function getCurrentSeason() {
  const month = Number(
    new Date().toLocaleString("en-US", { timeZone: TZ, month: "numeric" })
  );
  if ([12, 1, 2].includes(month)) return "winter";
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  return "fall";
}
const seasonRates = { winter: 1.25, spring: 1.0, summer: 0.9, fall: 1.0 };
const weatherRates = { rain: 1.1, storm: 1.15, snow: 1.2 };

module.exports = async function handler(req, res) {
  try {
    const allSavesResp = await fetch(`${FIREBASE_URL}/saves.json?auth=${FIREBASE_SECRET}`);
    const allSaves = await allSavesResp.json();

    if (!allSaves) {
      return res.status(200).json({ status: "no saves found" });
    }
      const seasonMult = seasonRates[getCurrentSeason()] ?? 1.0;
    const results = [];

    for (const [saveKey, save] of Object.entries(allSaves)) {
  try {
    // asleep? skip hunger entirely — don't drain, don't notify, don't touch the timestamp
    if (save.sleeping === true) {
      results.push({ saveKey, status: "lilguy is sleeping, skipping hunger check" });
      continue;
    }

    const weatherMult = weatherRates[save.weather] ?? 1.0;
    const now = Date.now();
    let hunger = save.hunger ?? 20;

    if (save.last_hunger_check) {
      const lastCheckMs = new Date(save.last_hunger_check).getTime();
      const wholeHours = Math.floor((now - lastCheckMs) / 3600000);
      if (wholeHours >= 1) {
        hunger = Math.max(0, hunger - wholeHours * seasonMult * weatherMult);
        save.last_hunger_check = new Date(lastCheckMs + wholeHours * 3600000).toISOString();
      }
    } else {
      save.last_hunger_check = new Date(now).toISOString();
    }

    await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hunger,
        last_hunger_check: save.last_hunger_check,
        last_hunger_check_local: toLocal(save.last_hunger_check),
      }),
    });

    if (hunger >= 10) {
      results.push({ saveKey, status: "not hungry yet", hunger });
      continue;
    }

    const lastNotified = save.last_notified ? new Date(save.last_notified) : null;
    const hoursSince = lastNotified ? (now - lastNotified.getTime()) / 3600000 : Infinity;
    if (hoursSince < 1) {
      results.push({ saveKey, status: "already notified recently", hunger });
      continue;
    }

    const subscription = save.subscription;
    if (!subscription) {
      results.push({ saveKey, status: "no subscription for this save", hunger });
      continue;
    }

    await webpush.sendNotification(subscription, JSON.stringify({
      title: "Lil Guy",
      body: `He's hungry! Hunger is at ${Math.round(hunger)}.`,
    }));

    const notifiedAt = new Date().toISOString();
    await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_notified: notifiedAt,
        last_notified_local: toLocal(notifiedAt),
      }),
    });

  

      results.push({ saveKey, status: "notification sent", hunger });
    } catch (innerError) {
      console.error(`check-hunger error for ${saveKey}:`, innerError);
      results.push({ saveKey, status: "error", message: innerError.message });
    }
  }

  return res.status(200).json({ results });
  } catch (error) {
    console.error("check-hunger handler error:", error);
    return res.status(500).json({ error: error.message });
  }
};
