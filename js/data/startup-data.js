// data/startup-data.js
let saveReady = false;   // only true once the real save has loaded
let loadFailed = false;
let isDevSave = false;      // set from /api/load-save's "dev" flag
let hideRedeemCode = false; // set from /api/load-save's "hideRedeemCode" flag
