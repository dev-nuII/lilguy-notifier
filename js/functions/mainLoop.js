// functions/mainLoop.js
// (moved out of js/game.js)

function mainLoop() {
  intervalId = setInterval(() => {
    tick();
    if (!state.running) clearInterval(intervalId);
  }, 1000);
}
