const webpush = require("web-push");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const TZ = "America/Chicago";
const SLEEP_DURATION_MS = 4 * 60 * 60 * 1000;

// tune this: cron runs hourly, only during the allowed window below,
// so this is roughly the per-hour chance of a nap starting
const SLEEP_CHANCE = 1 / 72;

const SLEEP_WINDOW_START_HOUR = 8;  // naps can only start between 8am
const SLEEP_WINDOW_END_HOUR = 20;   // and 8pm, local TZ

webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function toLocal(iso) {
  return new Date(iso).toLocaleString("en-US", { timeZone: TZ });
}

function toLocalDateStr(ms) {
  // YYYY-MM-DD in the target TZ, for the "already slept today" check
  const d = new Date(ms);
  return d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

function getCurrentLocalHour() {
  return Number(
    new Date().toLocaleString("en-US", { timeZone: TZ, hour: "numeric", hour12: false })
  );
}

module.exports = async function handler(req, res) {
  try {
    const allSavesResp = await fetch(`${FIREBASE_URL}/saves.json?auth=${FIREBASE_SECRET}`);
    const allSaves = await allSavesResp.json();

    if (!allSaves) {
      return res.status(200).json({ status: "no saves found" });
    }

    const now = Date.now();
    const todayStr = toLocalDateStr(now);
    const localHour = getCurrentLocalHour();
    const inWindow = localHour >= SLEEP_WINDOW_START_HOUR && localHour < SLEEP_WINDOW_END_HOUR;

    const results = [];

    for (const [saveKey, save] of Object.entries(allSaves)) {
      try {
        // ---- wake anyone whose nap has finished ----
        if (save.sleeping && save.sleep_wake_at && now >= save.sleep_wake_at) {
          await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sleeping: false,
              sleep_wake_at: null,
              stop_hunger_check: null,
            }),
          });

          if (save.subscription) {
            try {
              await webpush.sendNotification(save.subscription, JSON.stringify({
                title: "Lil Guy",
                body: "he woke up! come say hi",
              }));
            } catch (pushErr) {
              console.error(`wake push failed for ${saveKey}:`, pushErr.message);
            }
          }

          results.push({ saveKey, status: "woke up" });
          continue;
        }

        // already asleep, still not time to wake — nothing to do
        if (save.sleeping) {
          results.push({ saveKey, status: "still sleeping" });
          continue;
        }

        // ---- decide whether to start a nap ----
        if (!inWindow) {
          results.push({ saveKey, status: "outside sleep window" });
          continue;
        }

        if (save.slept_today === todayStr) {
          results.push({ saveKey, status: "already slept today" });
          continue;
        }

        if (Math.random() >= SLEEP_CHANCE) {
          results.push({ saveKey, status: "awake, no roll" });
          continue;
        }

        const wakeAt = now + SLEEP_DURATION_MS;
        await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sleeping: true,
            sleep_wake_at: wakeAt,
            sleep_wake_at_local: toLocal(new Date(wakeAt).toISOString()),
            slept_today: todayStr,
            stop_hunger_check: true,
          }),
        });

        if (save.subscription) {
          try {
            await webpush.sendNotification(save.subscription, JSON.stringify({
              title: "Lil Guy",
              body: "he's taking a nap for a bit",
            }));
          } catch (pushErr) {
            console.error(`sleep push failed for ${saveKey}:`, pushErr.message);
          }
        }

        results.push({ saveKey, status: "put to sleep", wakeAt });
      } catch (innerError) {
        console.error(`check-sleep error for ${saveKey}:`, innerError);
        results.push({ saveKey, status: "error", message: innerError.message });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("check-sleep error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
