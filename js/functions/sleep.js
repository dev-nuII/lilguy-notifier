// functions/sleep.js
// (moved out of js/state.js)

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
