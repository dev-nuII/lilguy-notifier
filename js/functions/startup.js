// functions/startup.js
// (moved out of js/startup.js)

async function startup() {
  const month = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(month)) state.season = "winter";
  else if ([3, 4, 5].includes(month)) state.season = "spring";
  else if ([6, 7, 8].includes(month)) state.season = "summer";
  else state.season = "fall";
  mods = season_modifiers[state.season];

  const w = await fetchWeather();
  state.weather = w.weather;
  hunger_drain_weather = w.drain;
  fetchBosses(); // no await — bossTable populates async, raid UI reads it when ready

  if (state.weather === "snow" && !state.seen_first_snow) {
    state.seen_first_snow = true;
    await showIntroMessage("...wait.", 1800);
    await showIntroMessage("what IS that?", 1800);
    await showIntroMessage("it's so quiet. and everything's turning white.", 2500);
    await showIntroMessage("i've never seen anything like this before.", 2500);
    state.bond += 8;
    checkUnlocks();
  }

  const saved = await loadSave();
  const today = dateOnlyUTC(new Date());

  // username/subscription come straight off the save record. The onboarding
  // fields themselves (and their show/hide logic) now live on the title
  // screen, handled by initOnboarding() before Play is even clicked — by the
  // time we get here that screen (and those elements) are already gone.
  state.username = (saved && saved.username) || state.username;
  state.hasSubscription = !!(saved && saved.subscription);

  if (saved) {
    state.mental_state = saved.mental_state ?? state.mental_state;
    state.mood = saved.mood ?? state.mood;
    state.event_running = saved.event_running ?? false;
    state.hp = saved.hp ?? state.hp;
    state.level = saved.level ?? 0;
    state.max_hp = saved.max_hp ?? state.max_hp;
    state.dmg = saved.dmg ?? state.dmg;
    state.recovery_seconds = saved.recovery_seconds ?? state.recovery_seconds;
    state.gear = saved.gear ?? [];
    state.unlocked_levels = saved.unlocked_levels ?? [];
    state.last_regen_at = saved.last_regen_at ?? Date.now();
    state.x = saved.x_pos ?? state.x;
    state.y = saved.y_pos ?? state.y;
    state.streak = saved.streak ?? 0;
    state.bond = saved.bond ?? 0;
    state.animation = saved.animation ?? 0;
    state.hunger = saved.hunger ?? state.hunger;
    state.pets_today = saved.pets_today ?? 8;
    state.save_num = saved.save_num ?? 0;
    state.highest_bond = saved.highest_bond ?? state.bond;
    state.unlocked_tiers = saved.unlocked_tiers ?? [];
    state.seen_first_snow = saved.seen_first_snow ?? false;
    state.isBossfight = saved.isBossfight ?? false;

    // ---- sleep state, driven by the cron job ----
    state.sleep_wake_at = saved.sleep_wake_at ?? null;
    state.slept_today = saved.slept_today ?? null;
    const now = Date.now();
    if (state.sleep_wake_at && now < state.sleep_wake_at) {
      state.sleeping = true;
    } else {
      state.sleeping = false;
      state.sleep_wake_at = null;
    }

    for (const tier of unlockTiers) {
      if (state.unlocked_tiers.includes(tier.threshold)) {
        dialogue[tier.sprite] = tier.lines;
      }
    }

    if (saved.last_pet_str) {
      const lastPet = new Date(saved.last_pet_str);
      const hoursPassed = (Date.now() - lastPet.getTime()) / 3600000;
      state.pets_today = Math.min(8, state.pets_today + Math.floor(hoursPassed));
    }

if (saved.last_hunger_check) {
      const lastHunger = new Date(saved.last_hunger_check);
      const hoursPassed = (Date.now() - lastHunger.getTime()) / 3600000;
      state.hunger = Math.max(0, state.hunger - hoursPassed);
    }
    if (saved.last_open_date) {
      state.last_open_date = dateOnlyUTC(new Date(saved.last_open_date));
      state.gap = daysBetween(state.last_open_date, today);
      if (state.gap === 1) {
        state.save_num += 1;
      } else if (state.gap === 2) {
        state.streak += 1;
        state.save_num += 1;
        state.pets_today = 8;
      } else {
        state.streak = 1;
      }
    } else {
      state.streak = 1;
      state.gap = 999;
    }
  } else {
    state.streak = 1;
    state.gap = 999;
  }

  if (state.hunger <= 2) {
    state.mental_state = "bad";
    state.mood = 3;
  }

  const isNewDay = !state.last_open_date || daysBetween(state.last_open_date, today) !== 1;
  if (isNewDay) {
    const offDayChance = randInt(1, 10);
    const dailyLuck = randInt(1, 5);
    state.bond += dailyLuck;
    if (offDayChance === 1) state.mood = 3;
    else if (state.streak >= 3) state.mood = choice([1, 1, 2]);
    else state.mood = randInt(1, 2);
  }

  // Still asleep — skip the greeting sequence below. The intro screen's
  // Continue button (wiring/main.js) checks state.sleeping once the player
  // clicks it and shows the sleep screen itself, so all we need to do here
  // is bail out early.
  if (state.sleeping) {
    return;
  }

  if (state.mood === 1) state.mental_state = "good";
  else if (state.mood === 3) state.mental_state = "bad";
  else state.mental_state = "neutral";

  await showIntroMessage("Made by your_local_robit and Claude.", 3000);
  if (saved && (saved.save_code || saved.recovery_code)) {
    await showIntroMessage("Save code: " + (saved.save_code || saved.recovery_code), 3000);
  }

  let greeting;
  if (state.gap === 0) greeting = "back already? nice";
  else if (state.gap === 1) greeting = "hey! good to see you";
  else if (state.gap <= 3) greeting = "it's been a bit, welcome back";
  else greeting = "oh — hey. it's been a while";
  await showIntroMessage(greeting, 2000);

  document.getElementById("introMessage").textContent =
    "Whenever you're ready — check your onboarding options above, then hit Continue.";

  lilguy_rect.x = state.x;

  // recheck weather periodically
  setInterval(async () => {
    const w2 = await fetchWeather();
    hunger_drain_weather = w2.drain;
    if (w2.weather !== state.weather) {
      state.weather = w2.weather;
      weather_particles = [];
      onWeatherChanged();
    }
  }, 10 * 60 * 1000);

  // catch a nap that started server-side while this tab is open
  setInterval(async () => {
    const s = await loadSave();
    if (!s) return;

    if (s.sleeping && !state.sleeping) {
      state.sleeping = true;
      state.sleep_wake_at = s.sleep_wake_at ?? null;
      state.slept_today = s.slept_today ?? null;
      state.current_line = "";
      stopAllMusic();
      showSleepScreen();
    } else if (!s.sleeping && state.sleeping) {
      wakeUp();
    }
  }, 5 * 60 * 1000);
 saveReady = !loadFailed;
  lastHungerAt = Date.now()
  // showIdleScreen()/mainLoop() now fire from the intro screen's Continue
  // button (js/wiring/main.js) so the player has time to read the messages
  // above and use the onboarding fields before the game actually starts.
}
