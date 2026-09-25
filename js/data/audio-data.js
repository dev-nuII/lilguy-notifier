// data/audio-data.js
// Music-system state variables (see functions/tryStartTitle.js etc for the
// functions that read/write these).
let titleStarted = false;

const AMBIENT_VOL = 0.4;
let currentTrack = null;
const fadeTimers = {};

const seasonTrack = {
  spring: "myAudio1",
  summer: "myAudio5",
  fall:   "myAudio8",
  winter: "myAudio3",
};
