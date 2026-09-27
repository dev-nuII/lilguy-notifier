// functions/handleClick.js
// (moved out of js/game.js)

async function handleClick(clickX, clickY) {
  if (state.sleeping) return;

  if (state.moment_active) {
    if (pointInRect(clickX, clickY, keep_rect)) {
      state.bond += 2;
      state.hunger = Math.min(20, state.hunger + 4);
      state.current_line = "i'll hang on to this. thanks for letting me.";
      state.moment_active = false;
      checkUnlocks();
      saveToCloud();
      return;
    }
    if (pointInRect(clickX, clickY, share_rect)) {
      state.bond += 6;
      state.current_line = "i gave it away. felt kinda good actually.";
      state.moment_active = false;
      checkUnlocks();
      saveToCloud();
      return;
    }
  }

  // flavor-only "goodnight" line — real sleep is controlled server-side
  if (isNightTime() && pointInRect(clickX, clickY, goodnight_rect)) {
    state.current_line = choice([
      "goodnight. i'll be here when you wake up.",
      "sleep well. i mean it.",
      "night. today was a good one, i think.",
    ]);
    state.lilstate = "-.-";
    state.lilstate1 = "-.-";
    state.sleeping = true;
    clearScreen(BLACK);
    drawText(state.current_line, 180, 300, RED);
    await sleep(5000);
    clearScreen(BLACK);
    releaseWakeLock();
    saveToCloud();
    browserSleep();
    return;
  }

  if (pointInRect(clickX, clickY, exit_rect)) {
    state.running = false;
    stopAllMusic();
    clearScreen(season_colors[state.season]);
    let bye;
    if (state.mood === 1) bye = "bye!! come back soon ok? <3";
    else if (state.mood === 3) bye = "....bye.";
    else bye = "see you later.";
    drawText(bye, 180, 300, state.mood === 1 ? GREEN : state.mood === 3 ? RED : YELLOW);
    saveToCloud();
    clearScreen(BLACK);

    document.getElementById("exitMessage").textContent = bye;
    document.getElementById("exitScreen").style.display = "flex";
    releaseWakeLock();
    return;
  }

  if (pointInRect(clickX, clickY, lilguy_rect)) {
    if (state.pets_today > 0) {
      state.bond += Math.round(1 * mods.bond_mult);
      state.pets_today -= 1;
      state.current_line = choice(["hehe", ":)", "that's nice"]);
    } else {
      state.current_line = "ok ok that's enough pets for now";
    }
    saveToCloud();
    return;
  }

  if (pointInRect(clickX, clickY, idle_rect)) {
    showIdleScreen();
    return;
  }
}
