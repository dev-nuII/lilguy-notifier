// functions/playTrack.js
// (moved out of js/audio.js)

function playTrack(id) {
  if (currentTrack === id) return;
  const prev = currentTrack ? document.getElementById(currentTrack) : null;
  currentTrack = id;

  const next = document.getElementById(id);
  next.loop = true;
  next.volume = 0;
  next.currentTime = 0;
  next.play()
    .then(() => fadeTo(next, AMBIENT_VOL, 2500))
    .catch(err => console.log("track blocked:", id, err.name));

  if (prev) fadeTo(prev, 0, 2000, () => prev.pause());
}
