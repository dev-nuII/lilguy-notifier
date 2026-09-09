const webpush = require("web-push");
const db = require("./firebase");

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

// Same rate tables as the Python script's season_modifers / weather multipliers
const seasonRates = {
  winter: 1.25,
  spring: 1.0,
  summer: 0.9,
  fall: 1.0
};

const weatherRates = {
  rain: 1.1,
  storm: 1.15,
  snow: 1.2
};

module.exports = async function handler(req, res) {
  try {
    // Load save from Firebase using Admin SDK
    const saveSnapshot = await db.ref("lilguy_var0").once("value");
    const save = saveSnapshot.val();

    if (!save) {
      return res.status(200).json({
        status: "no save data found"
      });
    }

    const seasonMult = seasonRates[getCurrentSeason()];
    const weatherMult = weatherRates[save.weather] ?? 1.0;

    let hunger = save.hunger ?? 20;

    if (save.last_hunger_check) {
      const lastCheck = new Date(save.last_hunger_check);

      const hoursPassed =
        (Date.now() - lastCheck.getTime()) / 3600000;

      hunger = Math.max(
        0,
        hunger -
          Math.floor(hoursPassed) *
            seasonMult *
            weatherMult
      );
    }

    // Write corrected hunger back to Firebase
    const nowIso = new Date().toISOString();

    await db.ref("lilguy_var0").update({
      hunger: hunger,
      last_hunger_check: nowIso
    });

    // Not hungry enough to notify
    if (hunger >= 10) {
      return res.status(200).json({
        status: "not hungry yet",
        hunger
      });
    }

    // Check when we last sent a notification
    const lastNotified = save.last_notified
      ? new Date(save.last_notified)
      : null;

    const hoursSinceNotified = lastNotified
      ? (Date.now() - lastNotified.getTime()) / 3600000
      : 999;

    if (hoursSinceNotified < 6) {
      return res.status(200).json({
        status: "already notified recently",
        hunger
      });
    }

    // Load push subscription using Admin SDK
    const subSnapshot =
      await db.ref("push_subscription").once("value");

    const subscription = subSnapshot.val();

    if (!subscription) {
      return res.status(200).json({
        status: "no push subscription saved"
      });
    }

    // Send push notification
    const payload = JSON.stringify({
      title: "Lil Guy",
      body: `He's hungry! Hunger is at ${Math.round(hunger)}.`
    });

    await webpush.sendNotification(
      subscription,
      payload
    );

    // Record notification time
    await db.ref("lilguy_var0").update({
      last_notified: new Date().toISOString()
    });

    return res.status(200).json({
      status: "notification sent",
      hunger
    });

  } catch (e) {
    console.error("check-hunger error:", e);

    return res.status(500).json({
      status: "error",
      message: e.message
    });
  }
};
