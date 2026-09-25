// functions/fillRect.js
// (moved out of js/canvas.js)

function fillRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
