// functions/updateSleepCountdown.js
// (moved out of js/screens.js)

function updateSleepCountdown() {
  if (!state.sleep_wake_at) return;
  const msLeft = state.sleep_wake_at - Date.now();
  if (msLeft <= 0) {
    document.getElementById("sleepCountdown").textContent = "waking up...";
    return;
  }
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  document.getElementById("sleepCountdown").textContent = `back in ~${h}h ${m}m`;
}
