// functions/clearScreen.js
// (moved out of js/canvas.js)

function clearScreen(color) {
  fillRect(0, 0, canvas.width, canvas.height, color);
}
