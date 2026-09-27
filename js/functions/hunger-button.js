function hungerButton () {
    if (state.hunger < 20) {
      const gained = Math.min(3, 20 - state.hunger);
      state.hunger += gained;
      state.bond += Math.round(gained * 2 * mods.bond_mult);
    }
    saveToCloud();
    return;
  }
