const path = require("path");
const ytdlp = require("../services/ytdlp.service");
const ffmpeg = require("../services/ffmpeg.service");
const fileService = require("../services/file.service");
const config = require("../config");
const { sanitizeUrl } = require("../utils/sanitize");
const logger = require("../utils/logger");

/**
 * POST /api/clips/split — download video + split it into clips.
 */
exports.split = async (req, res, next) => {
  const url = sanitizeUrl(req.body.url);
  if (!url) return res.status(400).json({ error: "A valid URL is required" });

  const { clipDuration: rawDur = 60, frameSize: rawFrame = "original" } = req.body;

  const clipDuration = Math.max(
    config.split.minDuration,
    Math.min(config.split.maxDuration, parseInt(rawDur, 10) || config.split.defaultDuration)
  );
  const frameSize = config.split.allowedFrameSizes.includes(rawFrame) ? rawFrame : "original";

  const { id, dir } = fileService.createWorkDir("split");

  try {
    // 1. Download
    const dlTemplate = path.join(dir, "source.%(ext)s");
    await ytdlp.downloadVideo(url, dlTemplate, {});

    const sourceFile = fileService.findByPrefix(dir, "source");
    if (!sourceFile) throw new Error("Download failed — no source file");

    const inputFile = path.join(dir, sourceFile);

    // 2. Split
    const { clips, totalDuration } = await ffmpeg.splitVideo(inputFile, dir, {
      clipDuration,
      frameSize,
      workId: id,
    });

    res.json({ clips, totalDuration, workId: id });
  } catch (err) {
    fileService.cleanup(dir);
    logger.error("Split error:", err.message);
    next(err);
  }
};

/**
 * GET /api/clips/:workId/:filename — serve a single clip file.
 */
exports.getClip = (req, res) => {
  const { workId, filename } = req.params;
  const filePath = fileService.resolveClipPath(workId, filename);

  if (!filePath) {
    return res.status(404).json({ error: "Clip not found" });
  }

  res.download(filePath, filename);
};
