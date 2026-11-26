import React from "react";
import { AbsoluteFill, Video, Sequence } from "remotion";
import { Main } from "./Main";
import { Hook } from "./Hook";
import { Title } from "./Title";
import { CTA } from "./CTA";
import { Captions } from "./Captions";
import { Background } from "./Background";

export const MainVideo = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Video src={Main.videoUrl} />
      <Sequence name="Hook">
        <Hook text={Main.hook} />
      </Sequence>
      <Sequence name="Title">
        <Title text={Main.title} />
      </Sequence>
      <Sequence name="Captions">
        <Captions />
      </Sequence>
      <Sequence name="CTA">
        <CTA text={Main.cta} />
      </Sequence>
    </AbsoluteFill>
  );
};