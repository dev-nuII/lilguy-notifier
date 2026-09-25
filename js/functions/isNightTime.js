// functions/isNightTime.js
// (moved out of js/state.js)

function isNightTime() {
  const h = new Date().getHours();
  return h >= 22 || h < 6;
}
