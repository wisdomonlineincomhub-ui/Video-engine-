import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({ status: "Video Engine Running", modes: ["short=remotion", "long=ffmpeg"] });
});

app.post("/render", async (req, res) => {
  const { type, script, clips, platform } = req.body;
  console.log("New job:", type, platform);

  if (type === "short") {
    return res.json({
      success: true,
      mode: "remotion-short",
      message: "Short sent to Remotion",
      videoUrl: "https://your-backend.onrender.com/videos/short-sample.mp4"
    });
  }

  if (type === "long") {
    return res.json({
      success: true,
      mode: "ffmpeg-long",
      message: "Long tutorial sent to FFmpeg",
      videoUrl: "https://your-backend.onrender.com/videos/long-sample.mp4"
    });
  }

  return res.status(400).json({ error: "type must be short or long" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on " + PORT));
