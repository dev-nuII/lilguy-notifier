// functions/getCanvasCoords.js
// (moved out of js/game.js)

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / canvasScale,
    y: (clientY - rect.top) / canvasScale,
  };
}
