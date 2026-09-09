const db = require("./firebase");

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const subscription = req.body;

    if (!subscription ||
        !subscription.endpoint ||
        !subscription.keys) {

      return res.status(400).json({
        error: "Invalid push subscription"
      });
    }

    await db.ref("push_subscription").set(subscription);

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    console.error("save-push error:", error);

    return res.status(500).json({
      error: "Failed to save subscription"
    });
  }
};
