// functions/stopTitle.js
// (moved out of js/audio.js)

function stopTitle() {
  const t = document.getElementById("myAudio7");
  const steps = 15;
  let i = 0;
  const startVol = t.volume;
  const fade = setInterval(() => {
    i++;
    t.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) {
      clearInterval(fade);
      t.pause();
      t.currentTime = 0;
    }
  }, 40);
}
