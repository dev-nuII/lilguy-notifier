// functions/initOnboarding.js
// Runs once at page load, before the player has clicked PLAY. The
// enable-notifications / redeem-code / enter-a-name fields now live on the
// title screen, so they need the save loaded (and saveReady set) right away —
// otherwise "Enter a name" would silently no-op, since saveToCloud() bails
// out whenever saveReady is false. startup() will call loadSave() again once
// Play is clicked, which just re-reads the same save — harmless.

async function initOnboarding() {
  const saved = await loadSave();
  state.username = (saved && saved.username) || state.username;
  state.hasSubscription = !!(saved && saved.subscription);
  saveReady = !loadFailed;
  applyOnboardingVisibility();
}

initOnboarding();
