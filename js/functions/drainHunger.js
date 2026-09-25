// functions/drainHunger.js
// (moved out of js/state.js)

function drainHunger() {
  const now = Date.now();
  const hours = (now - lastHungerAt) / 3600000;
  lastHungerAt = now;
  state.hunger = Math.max(0, state.hunger - hours * mods.hunger_drain * hunger_drain_weather);
}
