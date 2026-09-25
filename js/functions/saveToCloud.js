// functions/saveToCloud.js
// (moved out of js/cloud.js)

async function saveToCloud() {
  if (!saveReady) return;
  const data = {
    mental_state: state.mental_state,
    mood: state.mood,
    hp: state.hp,
    level: state.level,
    max_hp: state.max_hp,
    dmg: state.dmg,
    recovery_seconds: state.recovery_seconds,
    unlocked_levels: state.unlocked_levels,
    last_regen_at: state.last_regen_at,
    x_pos: state.x,
    y_pos: state.y,
    last_open_date: new Date().toISOString().slice(0, 10),
    streak: state.streak,
    bond: state.bond,
    animation: state.animation,
    last_hunger_check: new Date().toISOString(),
    hunger: state.hunger,
    pets_today: state.pets_today,
    last_pet_str: new Date().toISOString(),
    weather: state.weather,
    save_num: state.save_num,
    highest_bond: state.highest_bond,
    unlocked_tiers: state.unlocked_tiers,
    seen_first_snow: state.seen_first_snow,
    userIp: userIp
    };

  try {
    const response = await fetch("/api/save-game", {
      method: "POST",
      credentials: "include",
      keepalive: true,                       // <-- new
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error("Save failed: HTTP " + response.status);
    }
  } catch (e) {
    console.log("cloud save failed:", e);
  }
}
