const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const path = require("path");
const logger = require("../utils/logger");

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const SCALE_FILTERS = {
  "9:16": "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
  "1:1":  "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
  "16:9": "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
  original: null,
};

class FfmpegService {
  /**
   * Probe the total duration (seconds) of a media file.
   */
  getDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        resolve(Math.floor(metadata.format.duration || 0));
      });
    });
  }

  /**
   * Split a single clip from a video.
   * @returns {Promise<void>}
   */
  _splitOneClip(inputFile, outPath, start, duration, filterStr) {
    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputFile)
        .setStartTime(start)
        .setDuration(duration)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions("-y");

      if (filterStr) {
        cmd = cmd.videoFilter(filterStr);
      }

      cmd
        .output(outPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
  }

  /**
   * Split a video into clips and return metadata about each clip.
   * @param {string} inputFile - absolute path to source video
   * @param {string} workDir   - directory to write clips into
   * @param {object} opts      - { clipDuration, frameSize, workId }
   * @returns {Promise<{ clips: Array, totalDuration: number }>}
   */
  async splitVideo(inputFile, workDir, { clipDuration, frameSize, workId }) {
    const totalDuration = await this.getDuration(inputFile);
    const numClips = Math.ceil(totalDuration / clipDuration);
    const filterStr = SCALE_FILTERS[frameSize] || null;

    logger.info(`Splitting into ${numClips} clips (${clipDuration}s each, frame: ${frameSize})`);

    const clips = [];

    for (let i = 0; i < numClips; i++) {
      const start = i * clipDuration;
      const duration = Math.min(clipDuration, totalDuration - start);
      const outPath = path.join(workDir, `clip_${i + 1}.mp4`);

      logger.debug(`Creating clip ${i + 1}: start=${start}s, duration=${duration}s`);
      await this._splitOneClip(inputFile, outPath, start, duration, filterStr);

      clips.push({
        id: i + 1,
        filename: `clip_${i + 1}.mp4`,
        start,
        duration,
        downloadUrl: `/api/clips/${workId}/clip_${i + 1}.mp4`,
      });
    }

    return { clips, totalDuration };
  }
}

module.exports = new FfmpegService();


module.exports = new FfmpegService();
