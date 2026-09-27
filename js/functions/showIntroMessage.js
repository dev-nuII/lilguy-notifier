// functions/showIntroMessage.js
// Puts a line of text on the intro/contributions screen and waits, replacing
// the old clearScreen(); drawText(); await sleep(); canvas pattern so this
// messaging can live on #introScreen instead of the game canvas.

async function showIntroMessage(text, ms = 2000) {
  document.getElementById("introMessage").textContent = text;
  await sleep(ms);
}
