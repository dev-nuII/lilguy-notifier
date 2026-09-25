// wiring/canvas-init.js
// Hooks resizeCanvas() up to the window and runs it once at load.
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();
