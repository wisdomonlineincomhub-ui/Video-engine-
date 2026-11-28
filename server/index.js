const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const TMP = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const jobs = {};

// R2 client
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});
const BUCKET = process.env.R2_BUCKET || "video-engine-output";

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error("ffmpeg failed: " + err.slice(-2000)));
    });
  });
}

function esc(text) {
  return String(text || "").replace(/:/g, "\\:").replace(/'/g, "").replace(/"/g, "").slice(0, 80);
}

async function doRenderMain(jobId, body) {
  const startedAt = jobs[jobId].startedAt;
  try {
    const { hook = "", hookSub = "", title = "", cta = "", ctaSub = "", videoUrl = "", duration = 30 } = body;
    if (!videoUrl) {
      jobs[jobId] = { status: "error", error: "videoUrl is required" };
      return;
    }

    const inputPath = path.join(TMP, `in-${jobId}.mp4`);
    const outputPath = path.join(TMP, `main-${jobId}.mp4`);

    // 1. Download video
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error("Download failed: " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(inputPath, buf);

    // 2. FFmpeg: scale to 720x1280, add hook + title + CTA
    // Use 720x1280 for free plan memory. Change to 1080x1920 later when you upgrade.
    const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
    const hookText = esc(hook);
    const titleText = esc(title);
    const ctaText = esc(cta || "Follow for more");

    const filter = [
      `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280`,
      `drawtext=fontfile=${font}:text='${hookText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=80:box=1:boxcolor=black@0.6:boxborderw=12`,
      `drawtext=fontfile=${font}:text='${titleText}':fontcolor=yellow:fontsize=36:x=(w-text_w)/2:y=160:box=1:boxcolor=black@0.5:boxborderw=10`,
      `drawtext=fontfile=${font}:text='${ctaText}':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=h-140:box=1:boxcolor=red@0.8:boxborderw=12`,
    ].join(",");

    await runFFmpeg([
      "-y", "-i", inputPath,
      "-vf", filter,
      "-t", String(Math.min(Number(duration) || 30, 60)),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
      "-c:a", "aac", "-movflags", "+faststart",
      outputPath,
    ]);

    // 3. Upload to R2
    const fileBuffer = fs.readFileSync(outputPath);
    const key = `videos/main-${jobId}.mp4`;
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "video/mp4",
    }));

    const sizeMb = fileBuffer.length / (1024 * 1024);

    // 4. Clean tmp
    try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

    jobs[jobId] = {
      status: "done",
      key: key,
      bucket: BUCKET,
      sizeMb: Number(sizeMb.toFixed(2)),
      renderMs: Date.now() - startedAt,
    };
  } catch (e) {
    console.error("render error:", e);
    jobs[jobId] = { status: "error", error: e.message };
  }
}

app.post("/render-main", (req, res) => {
  const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  jobs[jobId] = { status: "processing", startedAt: Date.now() };
  res.json({ success: true, jobId, status: "processing", checkUrl: "/job/" + jobId });
  doRenderMain(jobId, req.body).catch((e) => {
    jobs[jobId] = { status: "error", error: e.message };
  });
});

app.get("/job/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.get("/health", (req, res) => res.json({ ok: true, service: "video-engine" }));
app.get("/", (req, res) => res.json({ service: "video-engine", status: "ok", engine: "ffmpeg" }));

app.listen(PORT, () => console.log(`Video engine running on port ${PORT}`));