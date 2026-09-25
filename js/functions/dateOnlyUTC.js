// functions/dateOnlyUTC.js
// (moved out of js/state.js)

function dateOnlyUTC(d) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}
