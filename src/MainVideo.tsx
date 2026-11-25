import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const MainVideo: React.FC<{ script: string }> = ({ script }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 30], [0.9, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          backgroundColor: "#FFD700",
          padding: 40,
          borderRadius: 30,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: "bold", color: "#000" }}>
          WISDOM ONLINE INCOME HUB
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#000",
            marginTop: 30,
            lineHeight: 1.3,
          }}
        >
          {script}
        </div>
        <div style={{ fontSize: 24, marginTop: 30, color: "#333" }}>
          Follow for more
        </div>
      </div>
    </AbsoluteFill>
  );
};