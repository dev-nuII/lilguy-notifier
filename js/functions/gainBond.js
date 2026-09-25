// functions/gainBond.js
// (moved out of js/state.js)

function gainBond(baseAmount) {
  const noise = 0.85 + Math.random() * 0.3;
  const gained = Math.round(baseAmount * BOND_SCALE * mods.bond_mult * noise);
  state.bond += gained;
  checkUnlocks();
}
