// functions/resizeCanvas.js
// (moved out of js/canvas.js)

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const scaleFactor = Math.min(window.innerWidth / 800, window.innerHeight / 600);
  const cssWidth = 800 * scaleFactor;
  const cssHeight = 600 * scaleFactor;

  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale((cssWidth / 800) * dpr, (cssWidth / 800) * dpr);
  ctx.font = "20px monospace";
  ctx.textBaseline = "top";
  canvasScale = cssWidth / 800;
}
