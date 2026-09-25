// functions/subscriptionToPlainObject.js
// (moved out of js/push.js)

function subscriptionToPlainObject(subscription) {
  const toBase64Url = (buffer) => {
    if (!buffer) return null;
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  let json = null;
  try {
    json = typeof subscription.toJSON === "function" ? subscription.toJSON() : null;
  } catch (e) {
    json = null;
  }

  if (json && json.endpoint && json.keys && json.keys.p256dh && json.keys.auth) {
    return json;
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: toBase64Url(subscription.getKey ? subscription.getKey("p256dh") : null),
      auth: toBase64Url(subscription.getKey ? subscription.getKey("auth") : null),
    },
  };
}
