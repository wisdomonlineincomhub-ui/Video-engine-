import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export const Captions: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        position: "absolute",
        bottom: 180,
        left: 40,
        right: 40,
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: 24,
        borderRadius: 20,
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: 42,
          fontWeight: "bold",
          lineHeight: 1.3,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {text}
      </div>
    </div>
  );
};