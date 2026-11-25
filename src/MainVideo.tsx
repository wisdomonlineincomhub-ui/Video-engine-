import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "./Background";
import { Captions } from "./Captions";

export const MainVideo: React.FC<{ script: string }> = ({ script }) => {
  const frame = useCurrentFrame();

  const words = script.split(" ");
  const wordsPerSecond = 2;
  const currentWordIndex = Math.floor(frame / 30 * wordsPerSecond);
  const visibleWords = words.slice(0, currentWordIndex + 1).join(" ");

  return (
    <AbsoluteFill>
      <Background />
      <Captions text={visibleWords || words[0]} />
    </AbsoluteFill>
  );
};