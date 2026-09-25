// functions/hideIdleScreen.js
// (moved out of js/screens.js)

function hideIdleScreen() {
  document.getElementById("idleScreen").style.display = "none";
  clearInterval(idleTimer);
  idleTimer = null;
}
