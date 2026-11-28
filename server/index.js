const express = require("express");
const cors = require("cors");
const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const PORT = process.env.PORT || 3000;
const BUCKET = process.env.R2_BUCKET || "lion-prime-video";
const FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";

// ---------------------------------------------------------------- R2 client

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ------------------------------------------------------------------- ffmpeg

/** Escape a string for ffmpeg drawtext. */
function esc(text) {
  return String(text == null ? "" : text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/\r?\n/g, " ");
}

function runFfmpeg(input, output, o) {
  const filters = [
    "scale=720:1280:force_original_aspect_ratio=increase",
    "crop=720:1280",
  ];

  const overlay = (text, size, y, opacity) => {
    if (!text) return;
    filters.push(
      `drawtext=fontfile=${FONT}:text='${esc(text)}'` +
        `:fontcolor=white:fontsize=${size}` +
        `:box=1:boxcolor=black@${opacity}:boxborderw=${Math.round(size / 2.5)}` +
        `:x=(w-text_w)/2:y=${y}`,
    );
  };

  overlay(o.hook, 64, "h*0.12", 0.55);
  overlay(o.hookSub, 40, "h*0.12+92", 0.45);
  overlay(o.title, 52, "h*0.45", 0.55);
  overlay(o.cta, 56, "h*0.78", 0.6);
  overlay(o.ctaSub, 38, "h*0.78+82", 0.45);

  const seconds = Math.max(1, Math.min(60, Number(o.duration) || 10));

  const args = [
    "-y",
    "-i", input,
    "-vf", filters.join(","),
    "-t", String(seconds),
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-threads", "1",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    output,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (d) => {
      err += d.toString();
      if (err.length > 8000) err = err.slice(-8000);
    });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-1200)}`)),
    );
  });
}

// ------------------------------------------------------------------ helpers

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(dest));
}

async function upload(file, key) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fs.createReadStream(file),
      ContentType: "video/mp4",
    }),
  );
}

async function renderJob(job) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "render-"));
  const input = path.join(dir, "in.mp4");
  const output = path.join(dir, "out.mp4");

  try {
    await download(job.videoUrl, input);
    await runFfmpeg(input, output, job);

    const key = `renders/${job.jobId}.mp4`;
    await upload(output, key);

    const stat = await fsp.stat(output);
    return { key, videoUrl: key, bytes: stat.size, duration: job.duration || 10 };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// --------------------------------------------------------------------- app

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "video-engine",
    status: "ok",
    routes: ["GET /health", "GET /r2-test", "POST /render-main"],
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime(), bucket: BUCKET });
});

app.post("/render-main", async (req, res) => {
  if (process.env.RENDER_SHARED_SECRET) {
    if (req.get("x-render-key") !== process.env.RENDER_SHARED_SECRET) {
      return res.status(401).json({ success: false, error: "unauthorized" });
    }
  }

  const body = req.body || {};
  if (!body.videoUrl) {
    return res.status(400).json({ success: false, error: "videoUrl is required" });
  }

  const job = {
    jobId: body.postId || body.jobId || crypto.randomUUID(),
    videoUrl: body.videoUrl,
    duration: body.duration || 10,
    hook: body.hook || "",
    hookSub: body.hookSub || "",
    title: body.title || "",
    cta: body.cta || "",
    ctaSub: body.ctaSub || "",
  };

  if (body.callbackUrl) {
    res.status(202).json({ success: true, accepted: true, jobId: job.jobId });

    renderJob(job)
      .then(async (result) => {
        await fetch(body.callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.jobId, success: true, ...result }),
        }).catch(() => {});
      })
      .catch(async (e) => {
        await fetch(body.callbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: job.jobId,
            success: false,
            error: String(e.message || e),
          }),
        }).catch(() => {});
      });

    return;
  }

  try {
    const result = await renderJob(job);
    res.json({ success: true, jobId: job.jobId, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e.message || e) });
  }
});

// ------------------------------------------------------- R2 credential probe

app.get("/r2-test", async (_req, res) => {
  const env = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID
      ? `${process.env.R2_ACCOUNT_ID.length} chars (expect 32)`
      : "MISSING",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID
      ? `${process.env.R2_ACCESS_KEY_ID.length} chars (expect 32)`
      : "MISSING",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
      ? `${process.env.R2_SECRET_ACCESS_KEY.length} chars (expect 64)`
      : "MISSING",
    R2_BUCKET: process.env.R2_BUCKET || "lion-prime-video",
  };

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: "_healthcheck/probe.txt",
        Body: "probe " + new Date().toISOString(),
        ContentType: "text/plain",
      }),
    );
    return res.json({ success: true, message: "R2 write OK", env });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: {
        name: e.name,
        code: e.Code || e.code,
        message: e.message,
        httpStatus: e.$metadata && e.$metadata.httpStatusCode,
        requestId: e.$metadata && e.$metadata.requestId,
      },
      env,
    });
  }
});

// ------------------------------------------------------------------- 404

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "not found" });
});

app.listen(PORT, () => {
  console.log(`video-engine listening on :${PORT}`);
});
