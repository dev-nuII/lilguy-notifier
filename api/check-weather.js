const webpush = require("web-push");

// These come from environment variables (set in the Vercel dashboard,
// not written in this file) — similar to how you'd use os.environ.get()
// in Python instead of hardcoding a secret in the script.
const FIREBASE_URL = process.env.FIREBASE_URL;       // e.g. https://hhff-88ec0-default-rtdb.firebaseio.com
const SAVE_ID = process.env.SAVE_ID;                  // e.g. lilguy_var0
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:you@example.com", // Vercel/push spec requires a contact string here, doesn't need to be real
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// module.exports = ... is JS's version of Python's "if __name__ == '__main__':"
// entry point — this is the function Vercel actually calls when the URL is hit.
module.exports = async function handler(req, res) {
  try {
    // fetch() here works just like requests.get() in Python
    const saveResp = await fetch(`${FIREBASE_URL}/${SAVE_ID}.json`);
    const save = await saveResp.json();

    if (!save) {
      res.status(200).json({ status: "no save data found" });
      return;
    }
