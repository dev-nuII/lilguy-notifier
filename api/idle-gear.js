const { rollGear } = require("../lib/gear");

const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

const IDLE_THRESHOLD_HOURS = 6; // "happy" idle hours needed before a drop
const HAPPY_HUNGER_MIN = 10;    // matches the "hungry" cutoff in check-hunger.js

module.exports = async function handler(req, res) {
  try {
    const allSavesResp = await fetch(`${FIREBASE_URL}/saves.json?auth=${FIREBASE_SECRET}`);
    const allSaves = await allSavesResp.json();
    if (!allSaves) return res.status(200).json({ status: "no saves found" });

    const results = [];
    const now = Date.now();

    for (const [saveKey, save] of Object.entries(allSaves)) {
      try {
        if (save.sleeping === true) {
          results.push({ saveKey, status: "sleeping, skipping idle-gear check" });
          continue;
        }

        const lastCheck = save.last_idle_check ? new Date(save.last_idle_check).getTime() : now;
        const elapsedHours = (now - lastCheck) / 3600000;
        const MOOD_RATE = { 1: 1.5, 2: 1 }; // happy = 1.5x, neutral = baseline 1x. Sad (3) isn't listed -> falls to 0.
        const isFed = (save.hunger ?? 20) >= HAPPY_HUNGER_MIN;
        const moodRate = MOOD_RATE[save.mood ?? 2] ?? 0;

        let idleHappySeconds = save.idle_happy_seconds ?? 0;
        if (isFed && moodRate > 0) {
            idleHappySeconds += elapsedHours * 3600 * moodRate;
        } else {
            idleHappySeconds = 0; // hungry or sad resets the streak
        }

        const patch = {
          last_idle_check: new Date(now).toISOString(),
          idle_happy_seconds: idleHappySeconds,
        };

        if (idleHappySeconds >= IDLE_THRESHOLD_HOURS * 3600) {
          const gear = rollGear(null, true); // no dropTable -> flat idle roll
          const existingGear = Array.isArray(save.gear) ? save.gear : [];
          patch.gear = [...existingGear, gear];
          patch.idle_happy_seconds = 0; // reset after awarding
          results.push({ saveKey, status: "gear awarded", gear });
        } else {
          results.push({ saveKey, status: "accumulating", idleHappySeconds });
        }

        await fetch(`${FIREBASE_URL}/saves/${saveKey}.json?auth=${FIREBASE_SECRET}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } catch (innerError) {
        console.error(`idle-gear error for ${saveKey}:`, innerError);
        results.push({ saveKey, status: "error", message: innerError.message });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("idle-gear handler error:", error);
    return res.status(500).json({ error: error.message });
  }
};
