// functions/wantedTrack.js
// (moved out of js/audio.js)

function wantedTrack() {
  if (state.weather === "snow")  return "myAudio9";
  if (state.weather === "rain")  return "myAudio6";
  if (state.weather === "storm") return "myAudio4";
  if (state.weather === "cloudy") return "myAudio2";
  return seasonTrack[state.season] || "myAudio1";
}
