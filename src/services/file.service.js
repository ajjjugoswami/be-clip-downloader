const fs = require("fs");
const path = require("path");
const config = require("../config");
const { generateId } = require("../utils/helpers");
const logger = require("../utils/logger");

class FileService {
  constructor() {
    this._ensureDir(config.paths.temp);
  }

  /**
   * Create a unique work directory inside the temp root.
   * @param {string} prefix - e.g. "dl" or "split"
   * @returns {{ id: string, dir: string }}
   */
  createWorkDir(prefix = "work") {
    const id = generateId();
    const dir = path.join(config.paths.temp, `${prefix}-${id}`);
    fs.mkdirSync(dir, { recursive: true });
    logger.debug(`Created work dir: ${dir}`);
    return { id, dir };
  }

  /**
   * Find the first video file inside a directory.
   */
  findVideoFile(dir) {
    const files = fs.readdirSync(dir);
    return files.find((f) =>
      [".mp4", ".mkv", ".webm"].includes(path.extname(f).toLowerCase())
    );
  }

  /**
   * Find a file by prefix inside a directory.
   */
  findByPrefix(dir, prefix) {
    const files = fs.readdirSync(dir);
    return files.find((f) => f.startsWith(prefix));
  }

  /**
   * Safely remove a directory tree.
   */
  cleanup(dir) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      logger.debug(`Cleaned up: ${dir}`);
    } catch (err) {
      logger.warn(`Cleanup failed for ${dir}: ${err.message}`);
    }
  }

  /**
   * Resolve a clip file path — returns null if path traversal is detected.
   */
  resolveClipPath(workId, filename) {
    if (/[/\\.]/.test(workId) || !/^clip_\d+\.mp4$/.test(filename)) {
      return null;
    }
    const filePath = path.join(config.paths.temp, `split-${workId}`, filename);
    return fs.existsSync(filePath) ? filePath : null;
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = new FileService();
