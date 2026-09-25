// functions/releaseWakeLock.js
// (moved out of js/wakelock.js)

async function releaseWakeLock() {
  if (wakeLock) {
    try { await wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }
}
