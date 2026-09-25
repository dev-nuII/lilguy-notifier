// functions/browserSleep.js
// Called from handleClick.js when the player taps "goodnight" at night.
// Tells the server to put THIS save to sleep for 8 hours (real sleep is
// tracked server-side so it persists even if the tab is closed). The
// automated cron job in api/lilguy-sleep.js wakes everyone back up once
// sleep_wake_at has passed.

async function browserSleep() {
  try {
    const resp = await fetch("/api/lilguy-sleep-now", {
      method: "POST",
      credentials: "include",
    });

    if (!resp.ok) {
      throw new Error("Server returned " + resp.status);
    }

    const data = await resp.json();
    state.sleep_wake_at = data.sleep_wake_at;
    state.slept_today = data.slept_today;
  } catch (e) {
    console.log("browserSleep failed:", e);
  }
}
