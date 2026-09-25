// functions/fetchBosses.js
// Pulls the boss table from the server (lib/bosses.js is the single source
// of truth — add bosses there, not here) and caches it on the global
// bossTable for the raid UI to read once that's built.

let bossTable = [];

async function fetchBosses() {
  try {
    const resp = await fetch("/api/bosses");
    const data = await resp.json();
    bossTable = data.bosses ?? [];
  } catch (e) {
    console.log("boss table fetch failed:", e);
    bossTable = [];
  }
  return bossTable;
}
