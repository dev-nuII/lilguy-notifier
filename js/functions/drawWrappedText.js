// functions/drawWrappedText.js
// (moved out of js/canvas.js)

function drawWrappedText(text, x, y, maxChars, lineHeight, color) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  ctx.fillStyle = color;
  for (const word of words) {
    const testLine = line + word + " ";
    if (testLine.length > maxChars && line !== "") {
      ctx.fillText(line, x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
