const db = require("./firebase");

module.exports = async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://dev-nuii.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const subscription = req.body;

    if (
      !subscription ||
      typeof subscription !== "object" ||
      !subscription.endpoint ||
      !subscription.keys
    ) {
      return res.status(400).json({
        error: "Invalid push subscription"
      });
    }

    await db
      .ref("push_subscription")
      .set(subscription);

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
