const store = require("../db/store");

exports.getHistory = async (req, res, next) => {
  try {
    const history = await store.history.findByUserId(req.userId);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

exports.addHistory = async (req, res, next) => {
  try {
    const { title, url, platform, quality, thumbnail, type } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "title and type are required" });
    }

    const record = await store.history.add({
      userId:    req.userId,
      title:     String(title).slice(0, 500),
      url:       String(url || "").slice(0, 2000),
      platform:  String(platform || "other").slice(0, 50),
      quality:   String(quality || "").slice(0, 50),
      thumbnail: String(thumbnail || "").slice(0, 2000),
      type:      type === "clip" ? "clip" : "download",
      timestamp: Date.now(),
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

exports.clearHistory = async (req, res, next) => {
  try {
    await store.history.clearByUserId(req.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
