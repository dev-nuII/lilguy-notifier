// functions/checkUnlocks.js
// (moved out of js/state.js)

function checkUnlocks() {
  if (state.bond > state.highest_bond) state.highest_bond = state.bond;
  for (const tier of unlockTiers) {
    if (state.highest_bond >= tier.threshold && !state.unlocked_tiers.includes(tier.threshold)) {
      state.unlocked_tiers.push(tier.threshold);
      dialogue[tier.sprite] = tier.lines;
      state.current_line = tier.lines[0];
      state.line_display_timer = 0;
      saveToCloud();
    }
  }
}
