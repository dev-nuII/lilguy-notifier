// lib/bosses.js
// Single source of truth for boss data. Add a boss by adding an entry to
// BOSS_TABLE below — no other code needs to change for it to show up in
// the client (which fetches this via /api/bosses) or in the raid engine
// once that's built.
//
// failureHpLoss is derived, not authored per-boss: common bosses cost the
// player 2 hp on a failed raid, and it goes up by 1 per difficulty tier
// above common, per the original spec.

const DIFFICULTY_TIERS = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

const BOSS_TABLE = [
  {
    id: "mossback",
    name: "Mossback",
    difficulty: "common",
    hpPool: 40,
    timeLimitHours: 24,
    // dropTable is a weighted [{slot, rarity, weight}] list — keeps a
    // common boss from handing out rare gear, an epic boss from handing
    // out junk, etc. Weights don't need to sum to 100, just be consistent
    // relative to each other.
    dropTable: [
      { slot: "weapon", rarity: "common",   weight: 40 },
      { slot: "armor",  rarity: "common",   weight: 40 },
      { slot: "item",   rarity: "uncommon", weight: 20 },
    ],
  },
  {
    id: "duskhollow",
    name: "Duskhollow",
    difficulty: "uncommon",
    hpPool: 80,
    timeLimitHours: 24,
    dropTable: [
      { slot: "weapon", rarity: "uncommon", weight: 35 },
      { slot: "armor",  rarity: "uncommon", weight: 35 },
      { slot: "item",   rarity: "rare",     weight: 30 },
    ],
  },
];

function getBosses() {
  return BOSS_TABLE.map((b) => ({
    ...b,
    failureHpLoss: 2 + (DIFFICULTY_TIERS[b.difficulty] ?? 0),
  }));
}

function getBoss(id) {
  return getBosses().find((b) => b.id === id) || null;
}

module.exports = { getBosses, getBoss, DIFFICULTY_TIERS };
