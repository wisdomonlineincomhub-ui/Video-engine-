import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";

export const Hook = ({ text, subtext }: { text: string; subtext: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
  const opacity = interpolate(frame, [0, 10], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: "#FFD700", textAlign: "center", transform: `scale(${scale})`, opacity, textShadow: "0 0 20px black", lineHeight: 1.1 }}>
        {text}
      </div>
      <div style={{ fontSize: 32, color: "white", marginTop: 20, backgroundColor: "#FF0000", padding: "8px 20px", borderRadius: 20, fontWeight: 700, textAlign: "center" }}>
        {subtext}
      </div>
    </AbsoluteFill>
  );
};