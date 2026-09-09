const db = require("./firebase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        error: "Invalid save data"
      });
    }

    await db
      .ref("lilguy_var0")
      .set(data);

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("save-game error:", error);

    return res.status(500).json({
      error: "Failed to save game"
    });
  }
};
