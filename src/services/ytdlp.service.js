const { execSync } = require("child_process");
const config = require("../config");
const logger = require("../utils/logger");

class YtdlpService {
  /**
   * Fetch video metadata (title, thumbnail, duration, formats).
   */
  getVideoInfo(url) {
    logger.info(`Fetching video info: ${url}`);

    const raw = execSync(`yt-dlp --dump-json --no-download -- "${url}"`, {
      encoding: "utf-8",
      timeout: config.ytdlp.infoTimeout,
    });

    const info = JSON.parse(raw);

    const formats = (info.formats || [])
      .filter((f) => f.vcodec !== "none" && f.ext === "mp4")
      .map((f) => ({
        id: f.format_id,
        label: f.format_note || `${f.height}p`,
        ext: f.ext,
        height: f.height,
        filesize: f.filesize,
      }))
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .slice(0, 6);

    return {
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats,
    };
  }

  /**
   * Download a video to the given output template path.
   * @param {string} url - validated URL
   * @param {string} outTemplate - yt-dlp output template path
   * @param {object} opts - { format_id, quality }
   */
  downloadVideo(url, outTemplate, opts = {}) {
    const formatArg = this._buildFormatArg(opts);
    const cmd = `yt-dlp ${formatArg} --merge-output-format mp4 -o "${outTemplate}" -- "${url}"`;

    logger.info(`Downloading video: ${cmd}`);

    execSync(cmd, {
      encoding: "utf-8",
      timeout: config.ytdlp.downloadTimeout,
    });
  }

  /**
   * Build the -f argument for yt-dlp.
   */
  _buildFormatArg({ format_id, quality } = {}) {
    if (format_id && /^\d+$/.test(String(format_id))) {
      return `-f ${format_id}`;
    }

    if (quality) {
      const h = parseInt(quality, 10);
      if (!isNaN(h) && h > 0 && h <= 4320) {
        return `-f "bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best"`;
      }
    }

    return `-f "bestvideo+bestaudio/best"`;
  }
}

module.exports = new YtdlpService();
