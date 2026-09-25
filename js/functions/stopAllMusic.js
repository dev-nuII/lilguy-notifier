// functions/stopAllMusic.js
// (moved out of js/audio.js)

function stopAllMusic() {
  if (currentTrack) {
    const a = document.getElementById(currentTrack);
    fadeTo(a, 0, 2000, () => a.pause());
    currentTrack = null;
  }
}
