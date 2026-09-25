// functions/fadeTo.js
// (moved out of js/audio.js)

function fadeTo(audio, target, ms, onDone) {
  clearInterval(fadeTimers[audio.id]);
  const steps = 20, start = audio.volume;
  let i = 0;
  fadeTimers[audio.id] = setInterval(() => {
    i++;
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)));
    if (i >= steps) { clearInterval(fadeTimers[audio.id]); if (onDone) onDone(); }
  }, ms / steps);
}
