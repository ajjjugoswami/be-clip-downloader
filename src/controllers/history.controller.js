const crypto = require("crypto");
const store = require("../db/store");

exports.getHistory = (req, res) => {
  const history = store.history.findByUserId(req.userId);
  res.json(history);
};

exports.addHistory = (req, res) => {
  const { title, url, platform, quality, thumbnail, type } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const record = {
    id: crypto.randomUUID(),
    userId: req.userId,
    title: String(title).slice(0, 500),
    url: String(url || "").slice(0, 2000),
    platform: String(platform || "other").slice(0, 50),
    quality: String(quality || "").slice(0, 50),
    thumbnail: String(thumbnail || "").slice(0, 2000),
    type: type === "clip" ? "clip" : "download",
    timestamp: Date.now(),
  };

  store.history.add(record);
  res.status(201).json(record);
};

exports.clearHistory = (req, res) => {
  store.history.clearByUserId(req.userId);
  res.json({ success: true });
};
