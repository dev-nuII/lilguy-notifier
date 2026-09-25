// js/main.js
// Wires up buttons and page-lifecycle events. Loaded last, after every
// other file has defined the functions/state referenced here.

document.getElementById("enableNotifs").addEventListener("click", async () => {
  await setupPush();
  document.getElementById("enableNotifs").style.display = "none";
});

document.getElementById("startScreen").addEventListener("pointerdown", tryStartTitle);
tryStartTitle();

document.getElementById("playAgainBtn").addEventListener("click", () => {
  location.reload();
});

document.getElementById("playBtn").addEventListener("click", async () => {
  stopTitle();
  document.getElementById("startScreen").remove();
  requestWakeLock();

  await startup();

  if (state.sleeping) {
    showSleepScreen();
    updateSleepCountdown();
  } else {
    startMusicSystem();
  }
});

document.getElementById("exitIdle").addEventListener("click", hideIdleScreen);

document.getElementById("userName").addEventListener("click", () => {
  const user = document.getElementById("userInput").value.trim();
  if (!user) return;
  state.username = user;
  alert("username is " + user);
});

document.getElementById("redeemBtn").addEventListener("click", async () => {
  const code = document.getElementById("recoveryInput").value;
  try {
    const resp = await fetch("/api/redeem-code", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const result = await resp.json();
    if (!resp.ok) {
      alert(result.error || "Code not recognized");
      return;
    }
    alert("Save linked! Reloading...");
    location.reload();
  } catch (e) {
    alert("Redeem failed: " + e.message);
  }
});

// autosave every minute while playing
setInterval(() => { if (state.running) saveToCloud(); }, 60000);

// save when the app goes to the background / screen locks (the reliable mobile signal)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && state.running) saveToCloud();
});

// backup for iOS Safari and tab closes
window.addEventListener("pagehide", () => { if (state.running) saveToCloud(); });
