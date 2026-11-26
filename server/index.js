

```javascript
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const OUTPUT_DIR = path.join(__dirname, "..", "public", "videos");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
app.use("/videos", express.static(OUTPUT_DIR));

// In-memory job store
const jobs = {};

let bundleLocation = null;
async function getBundle() {
  if (!bundleLocation) {
    bundleLocation = await bundle({
      entryPoint: path.join(__dirname, "..", "remotion", "index.ts"),
      webpackOverride: (c) => c,
    });
  }
  return bundleLocation;
}

async function doRenderMain(jobId, body, baseUrl) {
  try {
    const { hook = "", hookSub = "", title = "", cta = "", ctaSub = "", videoUrl = "", duration = 30 } = body;
    if (!videoUrl) { jobs[jobId] = { status: "error", error: "videoUrl is required" }; return; }
    const durationInFrames = Math.max(90, Math.round(Number(duration) * 30));
    const inputProps = { hook, hookSub, title, cta, ctaSub, videoUrl, durationInFrames };
    const serveUrl = await getBundle();
    const composition = await selectComposition({ serveUrl, id: "MainVideo", inputProps });
    const finalPath = path.join(OUTPUT_DIR, `main-${jobId}.mp4`);
    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: finalPath,
      inputProps, concurrency: 1, chromiumOptions: { gl: "swangle" },
    });
    const sizeMb = fs.statSync(finalPath).size / (1024 * 1024);
    jobs[jobId] = {
      status: "done",
      videoUrl: baseUrl + "/videos/main-" + jobId + ".mp4",
      sizeMb: Number(sizeMb.toFixed(2)),
      renderMs: Date.now() - jobs[jobId].startedAt,
    };
  } catch (e) {
    console.error("render error:", e);
    jobs[jobId] = { status: "error", error: e.message };
  }
}

// Start render -> returns jobId immediately (no timeout)
app.post("/render-main", (req, res) => {
  const jobId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const baseUrl = req.protocol + "://" + req.get("host");
  jobs[jobId] = { status: "processing", startedAt: Date.now() };
  res.json({ success: true, jobId, status: "processing", checkUrl: "/job/" + jobId });
  doRenderMain(jobId, req.body, baseUrl).catch((e) => {
    jobs[jobId] = { status: "error", error: e.message };
  });
});

// Check job status
app.get("/job/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.get("/health", (req, res) => res.json({ ok: true, service: "video-engine" }));

app.listen(PORT, () => console.log(`Video engine running on port ${PORT}`));
```
