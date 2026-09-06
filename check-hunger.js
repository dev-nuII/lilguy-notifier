// api/check-hunger.js
//
// This is one "serverless function" — think of it like a single Python
// function that Vercel runs for you on demand, instead of a script you
// keep running yourself. Vercel automatically turns any file inside
// /api into a URL: this file becomes yourproject.vercel.app/api/check-hunger

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

// module.exports = ... is JS's version of Python's "if __name__ == '__main__':"
// entry point — this is the function Vercel actually calls when the URL is hit.
module.exports = async function handler(req, res) {
  try {
    // fetch() here works just like requests.get() in Python
    const saveResp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`);
    const save = await saveResp.json();

    if (!save) {
      res.status(200).json({ status: "no save data found" });
      return;
    }

    // recompute hunger the same way your game does on load —
    // hunger decays over time based on when it was last checked
    let hunger = save.hunger ?? 20;
    if (save.last_hunger_check) {
      const lastCheck = new Date(save.last_hunger_check);
      const hoursPassed = (Date.now() - lastCheck.getTime()) / 3600000;
      hunger = Math.max(0, hunger - Math.floor(hoursPassed));
    }

    if (hunger >= 10) {
      res.status(200).json({ status: "not hungry yet", hunger });
      return;
    }

    // avoid spamming a notification every 30 minutes once hunger is low —
    // only send again if it's been at least 6 hours since the last one
    const lastNotified = save.last_notified ? new Date(save.last_notified) : null;
    const hoursSinceNotified = lastNotified ? (Date.now() - lastNotified.getTime()) / 3600000 : 999;
    if (hoursSinceNotified < 6) {
      res.status(200).json({ status: "already notified recently", hunger });
      return;
    }

    // get the saved push subscription (the browser generated this
    // when you tapped "Enable Notifications")
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

    // record that we just notified, so we don't do it again for 6 hours
    await fetch(`${FIREBASE_URL}/${SAVE_ID}/last_notified.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(new Date().toISOString()),
    });

    res.status(200).json({ status: "notification sent", hunger });
  } catch (e) {
    // equivalent of an except Exception as e: print(e) in Python
    console.log("check-hunger error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
};
