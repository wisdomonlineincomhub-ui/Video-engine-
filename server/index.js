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

app.post("/render-main", async (req, res) => {
  const startedAt = Date.now();
  try {
    const {
      hook = "", hookSub = "", title = "", cta = "", ctaSub = "",
      videoUrl = "", duration = 30,
    } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, error: "videoUrl is required" });
    }

    const durationInFrames = Math.max(90, Math.round(Number(duration) * 30));
    const inputProps = { hook, hookSub, title, cta, ctaSub, videoUrl, durationInFrames };

    const serveUrl = await getBundle();
    const composition = await selectComposition({ serveUrl, id: "MainVideo", inputProps });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const finalPath = path.join(OUTPUT_DIR, `main-${id}.mp4`);

    await renderMedia({
      composition, serveUrl, codec: "h264", outputLocation: finalPath,
      inputProps, concurrency: 1, chromiumOptions: { gl: "swangle" },
    });

    const sizeMb = fs.statSync(finalPath).size / (1024 * 1024);
    res.json({
      success: true,
      videoUrl: `${req.protocol}://${req.get("host")}/videos/main-${id}.mp4`,
      durationFrames: durationInFrames,
      sizeMb: Number(sizeMb.toFixed(2)),
      renderMs: Date.now() - startedAt,
    });
  } catch (e) {
    console.error("render-main error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/health", (req, res) => res.json({ ok: true, service: "video-engine" }));

app.listen(PORT, () => console.log(`Video engine running on port ${PORT}`));