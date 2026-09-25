// functions/setupPush.js
// (moved out of js/push.js)

async function setupPush() {
  if (!("serviceWorker" in navigator)) {
    alert("serviceWorker not supported");
    return;
  }
  if (!("PushManager" in window)) {
    alert("PushManager not supported — likely iOS version below 16.4, or not launched from Home Screen");
    return;
  }

  let registration;
  try {
    registration = await navigator.serviceWorker.register("./sw.js");
  } catch (e) {
    alert("service worker registration failed: " + e.message);
    return;
  }

  if (!("Notification" in window)) {
    alert("Notification API not available at all — must launch from Home Screen icon, not a Safari tab");
    return;
  }

  const permission = await Notification.requestPermission();
  alert("permission result: " + permission);

  if (permission !== "granted") return;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const subscriptionPayload = subscriptionToPlainObject(subscription);
  if (!subscriptionPayload.endpoint || !subscriptionPayload.keys || !subscriptionPayload.keys.p256dh || !subscriptionPayload.keys.auth) {
    alert("Push subscription looked incomplete on this device (missing endpoint/keys) — this can happen on some iOS versions. Try removing the app from your Home Screen, re-adding it, and enabling notifications again.");
    return;
  }

  const outgoingBody = JSON.stringify(subscriptionPayload);

  try {
    const resp = await fetch("/api/save-push", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: outgoingBody
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      alert("Couldn't save notification subscription: " + (err.error || resp.status));
      return;
    }

    alert("Notifications enabled!");
  } catch (e) {
    alert("Couldn't reach the server to save notification subscription: " + e.message);
  }
}
