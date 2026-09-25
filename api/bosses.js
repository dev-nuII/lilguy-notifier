const { getBosses } = require("../lib/bosses");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  res.status(200).json({ bosses: getBosses() });
};
