// lib/gear.js
// All gear rolls happen here, server-side only, so a client can never
// self-report a fake drop into its own save. The idle-gear cron uses this
// now; the raid-completion endpoint should reuse it later rather than
// rolling its own.

const GEAR_SLOTS = ["weapon", "armor", "item"];

const RARITY_TABLE = [
  { rarity: "common",   weight: 55, bonusMin: 1, bonusMax: 2 },
  { rarity: "uncommon", weight: 28, bonusMin: 2, bonusMax: 4 },
  { rarity: "rare",     weight: 13, bonusMin: 4, bonusMax: 7 },
  { rarity: "epic",     weight: 3,  bonusMin: 7, bonusMax: 11 },
  { rarity: "legendary", weight: 1, bonusMin: 11, bonusMax: 15},
];
const isIdled_TABLE = [
  { rarity: "common",   weight: 57, bonusMin: 1, bonusMax: 2 },
  { rarity: "uncommon", weight: 30, bonusMin: 2, bonusMax: 4 },
  { rarity: "rare",     weight: 13, bonusMin: 4, bonusMax: 7 },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollRarity() {
  const total = RARITY_TABLE.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITY_TABLE) {
    if (roll < r.weight) return r;
    roll -= r.weight;
  }
  return RARITY_TABLE[0];
}

function rollRarityIdle() {
  const totalidle = isIdled_TABLE.reduce((sum1, r1) => sum1 + r1.weight, 0);
  let rollidle = Math.random() * totalidle;
  for (const r1 of isIdled_TABLE) {
    if (rollidle < r1.weight) return r1;
    roll1 -= r1.weight;
  }
  return isIdled_TABLE[0];
}
// dropTable is optional: a weighted [{slot, rarity, weight}] list, used by
// bosses so e.g. a common boss can't hand out rare gear. Without one (the
// idle-gear roll), slot is a flat 1-of-3 pick and rarity comes from
// RARITY_TABLE on its own.

function rollGear(dropTable, isIdled) {
  let slot, rarityEntry;
if (isIdled !== true){
  if (dropTable && dropTable.length) {
    const total = dropTable.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * total;
    let picked = dropTable[0];
    for (const d of dropTable) {
      if (roll < d.weight) { picked = d; break; }
      roll -= d.weight;
    }
    slot = picked.slot;
    rarityEntry = RARITY_TABLE.find((r) => r.rarity === picked.rarity) || RARITY_TABLE[0];
  } else {
    slot = GEAR_SLOTS[randInt(0, GEAR_SLOTS.length - 1)];
    rarityEntry = rollRarity();
  }
} else {
  if (dropTable && dropTable.length) {
    const total = dropTable.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * total;
    let picked = dropTable[0];
    for (const d of dropTable) {
      if (roll < d.weight) { picked = d; break; }
      roll -= d.weight;
    }
    slot = picked.slot;
    rarityEntry = isIdled_TABLE.find((r) => r.rarity === picked.rarity) || isIdled_TABLE[0];
  } else {
    slot = GEAR_SLOTS[randInt(0, GEAR_SLOTS.length - 1)];
    rarityEntry = rollRarityIdle();
  }
}

  const bonus = randInt(rarityEntry.bonusMin, rarityEntry.bonusMax);
  return {
    id: `${slot}_${rarityEntry.rarity}_${Date.now()}_${randInt(0, 999)}`,
    slot,
    rarity: rarityEntry.rarity,
    bonus,
    obtained_at: Date.now(),
  };
}

module.exports = { rollGear, GEAR_SLOTS, RARITY_TABLE };
