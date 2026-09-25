// functions/onWeatherChanged.js
// (moved out of js/audio.js)

function onWeatherChanged() {
  if (!state.sleeping) playTrack(wantedTrack());
}
