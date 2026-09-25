// functions/showIdleScreen.js
// (moved out of js/screens.js)

function showIdleScreen() {
  document.getElementById("idleScreen").style.display = "flex";
  requestWakeLock();
  updateIdleScreen();                              // fill immediately
  clearInterval(idleTimer);
  idleTimer = setInterval(updateIdleScreen, 1000); // then refresh every second
}
