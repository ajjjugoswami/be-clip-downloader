const path = require("path");
const ytdlp = require("../services/ytdlp.service");
const fileService = require("../services/file.service");
const { sanitizeUrl, sanitizeFilename } = require("../utils/sanitize");
const logger = require("../utils/logger");

/**
 * POST /api/info — get video metadata.
 */
exports.getInfo = async (req, res, next) => {
  try {
    const url = sanitizeUrl(req.body.url);
    if (!url) return res.status(400).json({ error: "A valid URL is required" });

    const info = await ytdlp.getVideoInfo(url);
    res.json(info);
  } catch (err) {
    logger.error("Info error:", err.message);
    next(err);
  }
};

/**
 * POST /api/download — download entire video as MP4.
 */
exports.download = async (req, res, next) => {
  const url = sanitizeUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "A valid URL is required" });

  const { format_id, quality } = req.body;
  const { id, dir } = fileService.createWorkDir("dl");

  try {
    const outTemplate = path.join(dir, "%(title)s.%(ext)s");
    await ytdlp.downloadVideo(url, outTemplate, { format_id, quality });

    const file = fileService.findVideoFile(dir);
    if (!file) throw new Error("No output file found after download");

    const filePath = path.join(dir, file);
    res.download(filePath, sanitizeFilename(file), (err) => {
      if (err) logger.error("Send error:", err.message);
      fileService.cleanup(dir);
    });
  } catch (err) {
    fileService.cleanup(dir);
    logger.error("Download error:", err.message);
    next(err);
  }
};
