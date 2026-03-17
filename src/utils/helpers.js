const crypto = require("crypto");

/**
 * Generate a short unique id for temp directories.
 */
function generateId() {
  return Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
}

/**
 * Format seconds into m:ss string.
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

module.exports = { generateId, formatTime };
