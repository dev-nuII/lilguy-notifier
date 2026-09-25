// functions/tryStartTitle.js
// (moved out of js/audio.js)

function tryStartTitle() {
  if (titleStarted) return;
  const t = document.getElementById("myAudio7");
  t.loop = true;
  t.volume = 0.4;
  t.play().then(() => { titleStarted = true; }).catch(() => {});
}
