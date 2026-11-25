import { registerRoot, Composition } from "remotion";
import { MainVideo } from "../src/MainVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          script: "Welcome to Wisdom Online Income Hub. Follow for more.",
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);