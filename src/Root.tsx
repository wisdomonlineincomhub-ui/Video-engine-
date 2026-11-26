import React from "react";
import { Composition } from "remotion";
import { MainVideo, MainVideoProps } from "./MainVideo";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const DEFAULT_FRAMES = 900; // 30s fallback

const defaultProps: MainVideoProps = {
  hook: "Nobody told you this about online money",
  hookSub: "SCAM ALERT",
  title: "How to start earning online in Nigeria",
  cta: "Follow for more",
  ctaSub: "Daily income tips",
  videoUrl: "",
  durationInFrames: DEFAULT_FRAMES,
};

const calcMeta = ({ props }: { props: MainVideoProps }) => ({
  durationInFrames: props.durationInFrames || DEFAULT_FRAMES,
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainVideo"
      component={MainVideo}
      durationInFrames={DEFAULT_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaultProps}
      calculateMetadata={calcMeta}
    />
  );
};