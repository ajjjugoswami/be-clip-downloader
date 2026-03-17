/**
 * Validate and sanitize a URL — only allow http/https, block shell metacharacters.
 * Returns the cleaned URL or null if invalid.
 */
function sanitizeUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  if (/[;&|`$(){}[\]<>!\n\r]/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Strip unsafe characters from a filename for Content-Disposition.
 */
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._\- ]/g, "_").slice(0, 200);
}

module.exports = { sanitizeUrl, sanitizeFilename };
