// functions/updateIdleScreen.js
// (moved out of js/screens.js)

function updateIdleScreen() {
  const now = new Date();

  // lines vanish after 5s in the game, so keep the last one visible here
  if (state.current_line) idleLastLine = state.current_line;

  document.getElementById("hp").textContent = "HP: " + state.hp;
  document.getElementById("hunger").textContent = "Hunger: " + Math.round(state.hunger);
  document.getElementById("mood").textContent = "Mood: " + state.mental_state;

  let sleepText = "Awake";
  if (state.sleeping) {
    const msLeft = Math.max(0, (state.sleep_wake_at || 0) - Date.now());
    const h = Math.floor(msLeft / 3600000);
    const m = Math.floor((msLeft % 3600000) / 60000);
    sleepText = `Sleeping (back in ~${h}h ${m}m)`;
  }
  document.getElementById("sleeping").textContent = sleepText;

  document.getElementById("clock").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  document.getElementById("lilguyDialouge").textContent = idleLastLine ? `"${idleLastLine}"` : "...";
  document.getElementById("timeRunning").textContent = "Time together this session: " + formatDuration(state.session_seconds);
}
