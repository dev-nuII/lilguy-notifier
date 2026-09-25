// wiring/wakelock-listener.js
// Re-acquires the wake lock whenever the tab becomes visible again.
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && state.running) {
    await requestWakeLock();
  }
});
