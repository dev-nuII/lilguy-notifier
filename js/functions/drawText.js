// functions/drawText.js
// (moved out of js/canvas.js)

function drawText(text, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
