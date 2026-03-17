const { execSync } = require("child_process");
const path = require("path");
const config = require("../config");
const logger = require("../utils/logger");

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
    const raw = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" }
    );
    return Math.floor(parseFloat(raw.trim()));
  }

  /**
   * Split a video into clips and return metadata about each clip.
   * @param {string} inputFile - absolute path to source video
   * @param {string} workDir   - directory to write clips into
   * @param {object} opts      - { clipDuration, frameSize, workId }
   * @returns {{ clips: Array, totalDuration: number }}
   */
  splitVideo(inputFile, workDir, { clipDuration, frameSize, workId }) {
    const totalDuration = this.getDuration(inputFile);
    const numClips = Math.ceil(totalDuration / clipDuration);
    const vf = SCALE_FILTERS[frameSize] || null;
    const filterArg = vf ? `-vf "${vf}"` : "";

    logger.info(`Splitting into ${numClips} clips (${clipDuration}s each, frame: ${frameSize})`);

    const clips = [];

    for (let i = 0; i < numClips; i++) {
      const start = i * clipDuration;
      const duration = Math.min(clipDuration, totalDuration - start);
      const outPath = path.join(workDir, `clip_${i + 1}.mp4`);

      const cmd = `ffmpeg -ss ${start} -i "${inputFile}" -t ${duration} ${filterArg} -c:v libx264 -c:a aac -y "${outPath}"`;
      logger.debug(`ffmpeg: ${cmd}`);

      execSync(cmd, {
        encoding: "utf-8",
        timeout: config.ffmpeg.splitTimeout,
      });

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
