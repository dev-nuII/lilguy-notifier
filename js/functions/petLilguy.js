function petLilguy() {
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
