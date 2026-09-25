// functions/relationshipDescriptor.js
// (moved out of js/state.js)

function relationshipDescriptor() {
  if (state.bond >= 100 * BOND_SCALE) return "inseparable";
  if (state.bond >= 60 * BOND_SCALE) return "close";
  if (state.bond >= 30 * BOND_SCALE) return "comfortable";
  if (state.bond >= 10 * BOND_SCALE) return "getting to know each other";
  return "just met";
}
