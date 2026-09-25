// functions/tick.js
// (moved out of js/game.js)

function tick() {
  if (!state.running) return;

  // while asleep: just watch the clock, skip everything else
  if (state.sleeping) {
    lastHungerAt = Date.now()
    updateSleepCountdown();
    if (state.sleep_wake_at && Date.now() >= state.sleep_wake_at) {
      wakeUp();
    }
    return;
  }
  drainHunger();
  if (state.session_seconds % 3600 === 0 && state.session_seconds !== 0) {
  state.pets_today = Math.min(8, state.pets_today + 1);
}
  if (state.bond >= 100 * BOND_SCALE) state.lilguy_color = YELLOW;
  else if (state.bond >= 30 * BOND_SCALE) state.lilguy_color = "rgb(0,220,150)";
  else state.lilguy_color = GREEN;

  state.speech_timer += 1;
  if (state.speech_timer >= 120) {
    state.speech_timer = 0;
    if (randInt(1, 4) === 1 && state.mood !== 3) {
      state.current_line = choice(dialogue[state.season]);
    } else if (state.mood === 1) {
      state.current_line = choice(dialogue.happy);
    } else if (state.mood === 2) {
      state.current_line = choice(dialogue.neutral);
    } else {
      state.current_line = state.gap >= 1 ? choice(dialogue.angry_missed) : choice(dialogue.angry);
    }
  }

  if (state.current_line !== state.last_line_seen) {
    state.last_line_seen = state.current_line;
    state.line_display_timer = 0;
  } else if (state.current_line) {
    state.line_display_timer += 1;
    if (state.line_display_timer >= 5) {
      state.current_line = "";
      state.last_line_seen = "";
    }
  }

  if (!state.moment_active && !state.presence_moment_active && state.mood !== 3 && randInt(1, 1200) === 1 && idleTimer === null) {
    state.moment_active = true;
    state.moment_expires_at = state.session_seconds + 20;
    state.current_line = "hey... i found something. what should we do with it?";
  }
  if (state.moment_active && state.session_seconds >= state.moment_expires_at) {
    state.moment_active = false;
    state.current_line = "...guess it didn't matter that much.";
    state.mood = state.mood === 1 ? 2 : state.mood;
  }

  if (!state.moment_active && !state.presence_moment_active && state.mood !== 3 && randInt(1, 1800) === 1 && idleTimer === null) {
    state.presence_moment_active = true;
    state.presence_moment_expires_at = state.session_seconds + 12;
    state.current_line = "can you just... stay for a second?";
  }
  if (state.presence_moment_active && state.session_seconds >= state.presence_moment_expires_at) {
    state.presence_moment_active = false;
    state.current_line = "...thanks for staying.";
  }

  if (state.session_seconds % 30 === 0 || state.animation_seconds_override !== 0) {
    if (state.mood === 1) {
      const unlockedSprites = unlockTiers
        .filter(t => state.unlocked_tiers.includes(t.threshold))
        .map(t => t.sprite);
      const idle = choice(["walk", "wave", ...unlockedSprites]);
      if (idle === "walk") { state.lilstate = "_>"; state.lilstate1 = "<_"; state.animation = 1; }
      else if (idle === "wave") { state.lilstate = "0/"; state.lilstate1 = "0/"; state.animation = 3; }
      else {
        const tier = unlockTiers.find(t => t.sprite === idle);
        state.lilstate = tier.frames[0];
        state.lilstate1 = tier.frames[1];
      }
    } else {
      const idle = choice(["walk", "sit"]);
      if (idle === "walk") { state.lilstate = "_>"; state.lilstate1 = "<_"; state.animation = 1; }
      else { state.lilstate = "o"; state.lilstate1 = "o"; state.animation = 2; }
    }
  }
  state.session_seconds += 1;

  let text_surface = "_>";
  if (state.lilstate === "_>" && state.lilstate1 === "<_") {
    if (state.y === 1) {
      text_surface = "_>";
      state.x -= 10;
      if (state.x === 180) state.y = 0;
    } else {
      text_surface = "<_";
      state.x += 10;
      if (state.x === 600) state.y = 1;
    }
  } else if (state.lilstate === "0/" && state.lilstate1 === "0/") {
    text_surface = "0/";
  } else if (state.lilstate === "o" && state.lilstate1 === "o") {
    text_surface = "o";
  } else if (state.lilstate === "-.-" && state.lilstate1 === "-.-") {
    text_surface = "-.-";
  } else {
    const tier = unlockTiers.find(t => t.frames[0] === state.lilstate);
    if (tier) text_surface = tier.frames[0];
  }
  lilguy_rect = { x: state.x, y: 450, w: 30, h: 20 };

  draw(text_surface);
}
