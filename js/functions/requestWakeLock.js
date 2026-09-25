// functions/requestWakeLock.js
// (moved out of js/wakelock.js)

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) {
    console.log("Wake Lock API not supported on this browser");
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      console.log("wake lock released");
    });
  } catch (e) {
    console.log("wake lock request failed:", e.message);
  }
}
