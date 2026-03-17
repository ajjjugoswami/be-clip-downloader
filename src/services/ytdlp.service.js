const YTDlpWrap = require("yt-dlp-wrap").default;
const config = require("../config");
const logger = require("../utils/logger");

class YtdlpService {
  constructor() {
    this.ytdlp = new YTDlpWrap(config.paths.ytdlpBinary);
  }

  /**
   * Fetch video metadata (title, thumbnail, duration, formats).
   */
  async getVideoInfo(url) {
    logger.info(`Fetching video info: ${url}`);

    const raw = await this.ytdlp.execPromise([
      url,
      "--dump-json",
      "--no-download",
    ]);

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
  async downloadVideo(url, outTemplate, opts = {}) {
    const args = [
      url,
      ...this._buildFormatArgs(opts),
      "--merge-output-format", "mp4",
      "-o", outTemplate,
    ];

    logger.info(`Downloading video: yt-dlp ${args.join(" ")}`);
    await this.ytdlp.execPromise(args);
  }

  /**
   * Build format arguments array for yt-dlp.
   */
  _buildFormatArgs({ format_id, quality } = {}) {
    if (format_id && /^\d+$/.test(String(format_id))) {
      return ["-f", String(format_id)];
    }

    if (quality) {
      const h = parseInt(quality, 10);
      if (!isNaN(h) && h > 0 && h <= 4320) {
        return ["-f", `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`];
      }
    }

    return ["-f", "bestvideo+bestaudio/best"];
  }
}

module.exports = new YtdlpService();
