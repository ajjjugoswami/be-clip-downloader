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

    // Build a deduplicated list of available qualities
    const seen = new Set();
    const formats = (info.formats || [])
      .filter((f) => f.vcodec !== "none")
      .map((f) => ({
        id: f.format_id,
        label: f.format_note || (f.height ? `${f.height}p` : null),
        ext: f.ext,
        height: f.height,
        filesize: f.filesize,
        hasAudio: f.acodec !== "none",
      }))
      .filter((f) => f.height && f.label)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .filter((f) => {
        const key = f.height;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
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
      "--ffmpeg-location", config.paths.ffmpegBinary,
      "--merge-output-format", "mp4",
      // Re-encode audio to AAC so it's always MP4-compatible (VP9/Opus from
      // WebM-sourced formats cannot be stream-copied into an MP4 container).
      "--postprocessor-args", "ffmpeg:-c:a aac -c:v copy",
      "--embed-metadata",
      "--no-playlist",
      "-o", outTemplate,
    ];

    logger.info(`Downloading video: yt-dlp ${args.join(" ")}`);
    await this.ytdlp.execPromise(args);
  }

  /**
   * Build format arguments array for yt-dlp.
   */
  _buildFormatArgs({ format_id, quality } = {}) {
    // If a specific format_id is given, pair it with best audio.
    // Format IDs may include digits, letters, hyphens, and underscores (e.g. "248-sr").
    if (format_id && /^[\w][\w\-]*$/.test(String(format_id))) {
      return ["-f", `${format_id}+bestaudio/best`];
    }

    if (quality) {
      const h = parseInt(quality, 10);
      if (!isNaN(h) && h > 0 && h <= 4320) {
        return ["-f", `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`];
      }
    }

    // Default: always merge best video + best audio
    return ["-f", "bestvideo+bestaudio/best"];
  }
}

module.exports = new YtdlpService();
