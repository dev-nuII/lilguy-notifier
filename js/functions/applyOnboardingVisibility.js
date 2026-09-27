// functions/applyOnboardingVisibility.js
// Decides which of the intro screen's onboarding fields (enable notifications,
// redeem save code, enter a name) should be hidden, per:
//   - dev: always hide all three
//   - redeem code: hide once this browser's save cookie is more than a day old
//   - name entry: hide once the loaded save already has a username
//   - enable notifications: hide once the loaded save already has a subscription

function applyOnboardingVisibility() {
  const notifsField = document.getElementById("notifsField");
  const redeemField = document.getElementById("redeemField");
  const nameField = document.getElementById("nameField");

  if (isDevSave) {
    notifsField.style.display = "none";
    redeemField.style.display = "none";
    nameField.style.display = "none";
    return;
  }

  redeemField.style.display = hideRedeemCode ? "none" : "";
  nameField.style.display = state.username ? "none" : "";
  notifsField.style.display = state.hasSubscription ? "none" : "";
}
