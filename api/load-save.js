const db = require("./firebase");

module.exports = async function handler(req, res) {
  try {
    const snapshot = await db.ref("lilguy_var0").once("value");

    return res.status(200).json({
      save: snapshot.val()
    });

  } catch (error) {
    console.error("load-save error:", error);

    return res.status(500).json({
      error: "Failed to load save"
    });
  }
};
