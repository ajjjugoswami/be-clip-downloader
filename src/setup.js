const fs = require("fs");
const path = require("path");
const YTDlpWrap = require("yt-dlp-wrap").default;

const binDir = path.join(__dirname, "..", "bin");
const binPath = path.join(binDir, "yt-dlp" + (process.platform === "win32" ? ".exe" : ""));

async function setup() {
  if (fs.existsSync(binPath)) {
    console.log("yt-dlp binary already exists at", binPath);
    return;
  }

  console.log("Downloading yt-dlp binary...");
  fs.mkdirSync(binDir, { recursive: true });
  await YTDlpWrap.downloadFromGithub(binPath);
  console.log("yt-dlp binary downloaded to", binPath);
}

setup().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
