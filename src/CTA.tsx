import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const CTA = ({ text, subtext }: { text: string; subtext: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
      <div style={{ fontSize: 48, fontWeight: 900, color: "white", backgroundColor: "#FF0000", padding: "16px 32px", borderRadius: 50, transform: `scale