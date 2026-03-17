# ClipStream Backend - Node.js + yt-dlp

A self-hosted Node.js backend for ClipStream that handles video downloading and splitting using yt-dlp and ffmpeg.

---

## Prerequisites

- **Node.js** 18+ 
- **yt-dlp** installed globally: `pip install yt-dlp` or download from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases)
- **ffmpeg** installed globally: `sudo apt install ffmpeg` (Linux) or `brew install ffmpeg` (macOS)

Verify installations:
```bash
yt-dlp --version
ffmpeg -version
node --version
```

---

## Quick Start

### 1. Create project

```bash
mkdir clipstream-backend && cd clipstream-backend
npm init -y
npm install express cors helmet dotenv
```

### 2. Create `server.js`

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { execSync, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const TEMP_DIR = path.join(os.tmpdir(), "clipstream");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── Health Check ──────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Get Video Info ────────────────────────────
app.post("/api/info", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const raw = execSync(
      `yt-dlp --dump-json --no-download "${url}"`,
      { encoding: "utf-8", timeout: 30000 }
    );
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

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats,
    });
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

// ─── Download Video ────────────────────────────
app.post("/api/download", (req, res) => {
  const { url, format_id, quality } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const id = Date.now().toString(36);
  const outDir = path.join(TEMP_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  const formatArg = format_id
    ? `-f ${format_id}`
    : quality
    ? `-f "bestvideo[height<=${parseInt(quality)}]+bestaudio/best[height<=${parseInt(quality)}]/best"`
    : `-f "bestvideo+bestaudio/best"`;

  const outTemplate = path.join(outDir, "%(title)s.%(ext)s");

  try {
    execSync(
      `yt-dlp ${formatArg} --merge-output-format mp4 -o "${outTemplate}" "${url}"`,
      { encoding: "utf-8", timeout: 300000 }
    );

    const files = fs.readdirSync(outDir);
    const file = files.find((f) => f.endsWith(".mp4") || f.endsWith(".mkv") || f.endsWith(".webm"));
    if (!file) throw new Error("No output file found");

    const filePath = path.join(outDir, file);
    res.download(filePath, file, () => {
      // Cleanup after download
      fs.rmSync(outDir, { recursive: true, force: true });
    });
  } catch (err) {
    console.error("Download error:", err.message);
    fs.rmSync(outDir, { recursive: true, force: true });
    res.status(500).json({ error: "Failed to download video" });
  }
});

// ─── Split Video into Clips ───────────────────
app.post("/api/split", (req, res) => {
  const { url, filePath, clipDuration = 60, frameSize = "original" } = req.body;
  if (!url && !filePath) return res.status(400).json({ error: "URL or filePath required" });

  const id = Date.now().toString(36);
  const workDir = path.join(TEMP_DIR, `split-${id}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    let inputFile;

    if (filePath) {
      inputFile = filePath;
    } else {
      // Download the video first
      const dlTemplate = path.join(workDir, "source.%(ext)s");
      execSync(
        `yt-dlp -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${dlTemplate}" "${url}"`,
        { encoding: "utf-8", timeout: 300000 }
      );
      const files = fs.readdirSync(workDir);
      inputFile = path.join(workDir, files.find((f) => f.startsWith("source")));
    }

    // Get video duration
    const probeRaw = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${inputFile}"`,
      { encoding: "utf-8" }
    );
    const totalDuration = Math.floor(parseFloat(probeRaw.trim()));

    // Frame size filter
    const scaleFilters = {
      "9:16": "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      "1:1": "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
      "16:9": "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
      original: null,
    };

    const clips = [];
    const numClips = Math.ceil(totalDuration / clipDuration);

    for (let i = 0; i < numClips; i++) {
      const start = i * clipDuration;
      const duration = Math.min(clipDuration, totalDuration - start);
      const outPath = path.join(workDir, `clip_${i + 1}.mp4`);

      const vf = scaleFilters[frameSize];
      const filterArg = vf ? `-vf "${vf}"` : "";

      execSync(
        `ffmpeg -ss ${start} -i "${inputFile}" -t ${duration} ${filterArg} -c:v libx264 -c:a aac -y "${outPath}"`,
        { encoding: "utf-8", timeout: 120000 }
      );

      clips.push({
        id: i + 1,
        filename: `clip_${i + 1}.mp4`,
        start,
        duration,
        downloadUrl: `/api/clip/${id}/clip_${i + 1}.mp4`,
      });
    }

    res.json({ clips, totalDuration, workId: id });
  } catch (err) {
    console.error("Split error:", err.message);
    fs.rmSync(workDir, { recursive: true, force: true });
    res.status(500).json({ error: "Failed to split video" });
  }
});

// ─── Serve individual clip files ──────────────
app.get("/api/clip/:workId/:filename", (req, res) => {
  const { workId, filename } = req.params;
  const filePath = path.join(TEMP_DIR, `split-${workId}`, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Clip not found" });
  res.download(filePath, filename);
});

// ─── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ClipStream backend running on port ${PORT}`);
});
```

### 3. Run

```bash
node server.js
```

---

## API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | – | Health check |
| POST | `/api/info` | `{ url }` | Get video metadata & available formats |
| POST | `/api/download` | `{ url, format_id?, quality? }` | Download video as MP4 |
| POST | `/api/split` | `{ url?, filePath?, clipDuration, frameSize }` | Split video into clips |
| GET | `/api/clip/:workId/:filename` | – | Download a specific clip |

---

## Connect to Frontend

Set the environment variable in your Lovable project:

```
VITE_BACKEND_URL=https://your-server-address.com
```

Or for local development:

```
VITE_BACKEND_URL=http://localhost:8080
```

---

## Deployment Options

### Railway (Recommended for quick setup)
1. Push code to GitHub
2. Connect repo in [Railway](https://railway.app)
3. Add a Dockerfile:

```dockerfile
FROM node:18-slim
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && pip3 install yt-dlp
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

### DigitalOcean / VPS
```bash
# On your server
sudo apt update && sudo apt install -y nodejs npm python3-pip ffmpeg
pip3 install yt-dlp
git clone <your-repo> && cd clipstream-backend
npm install
# Use PM2 for production
npm install -g pm2
pm2 start server.js --name clipstream
```

### Docker
```bash
docker build -t clipstream-backend .
docker run -p 8080:8080 clipstream-backend
```

---

## Security Notes

- Add rate limiting for production: `npm install express-rate-limit`
- Add authentication if exposing publicly
- Set `CORS_ORIGIN` env variable to restrict to your frontend domain
- Temporary files are auto-cleaned after download

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `yt-dlp: command not found` | Install: `pip install yt-dlp` |
| `ffmpeg: command not found` | Install: `apt install ffmpeg` |
| Videos fail to download | Update yt-dlp: `pip install -U yt-dlp` |
| CORS errors | Check `CORS_ORIGIN` config and that your frontend URL is allowed |
| Large files timeout | Increase `timeout` values in execSync calls |
