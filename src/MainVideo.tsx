import React from "react";
import { AbsoluteFill, Video } from "remotion";
import { Hook } from "./Hook";
import { Title } from "./Title";
import { CTA } from "./CTA";
import { Background } from "./Background";

// VIDEO PROPS ONLY — no article content.
// Prop names confirmed:
//   Hook  -> { text, subtext }
//   Title -> { title }
//   CTA   -> { text, subtext }
export type MainVideoProps = {
  hook: string;
  hookSub: string;
  title: string;
  cta: string;
  ctaSub: string;
  videoUrl: string;
  durationInFrames: number;
};

export const MainVideo: React.FC<MainVideoProps> = ({
  hook,
  hookSub,
  title,
  cta,
  ctaSub,
  videoUrl,
  durationInFrames,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      <Background />

      {videoUrl ? (
        <Video
          src={videoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}

      <Hook text={hook} subtext={hookSub} />
      <Title title={title} />
      <CTA text={cta} subtext={ctaSub} />
    </AbsoluteFill>
  );
};