// functions/wakeUp.js
// (moved out of js/screens.js)

function wakeUp() {
  state.sleeping = false;
  state.sleep_wake_at = null;
  state.current_line = "mm... good morning";
  state.last_line_seen = "";
  hideSleepScreen();
  if (!currentTrack) startMusicSystem();
}
