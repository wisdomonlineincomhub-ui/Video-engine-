import React from "react";
import { AbsoluteFill } from "remotion";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #000000 0%, #1A1A1A 50%, #000000 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#FFD700",
          fontSize: 26,
          fontWeight: "bold",
          letterSpacing: 4,
          fontFamily: "Arial, sans-serif",
        }}
      >
        WISDOM ONLINE INCOME HUB
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#FFFFFF",
          fontSize: 22,
          fontFamily: "Arial, sans-serif",
          opacity: 0.7,
        }}
      >
        Follow • Like • Share
      </div>
    </AbsoluteFill>
  );
};