import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const Title = ({ title }: { title: string }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const y = interpolate(frame, [0, 20], [40, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{ fontSize: 64, fontWeight: 900, color: "white", textAlign: "center", opacity, transform: `translateY(${y}px)`, textShadow: "0 4px 20px black", lineHeight: 1.1 }}>
        {title}
      </div>
    </AbsoluteFill>
  );
};