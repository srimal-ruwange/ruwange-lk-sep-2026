"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import SectionMark from "./motion/SectionMark";
import Reveal from "./motion/Reveal";
import type { LayersState, LayerLabels } from "./three/Layers";

const Layers = dynamic(() => import("./three/Layers"), { ssr: false });

export default function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const stateRef = useRef<LayersState>({ p: 0 });
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      gsap.from(".caps-note", { y: 18, opacity: 0, duration: 1, scrollTrigger: { trigger: ".caps-note", start: "top 88%", once: true } });
      // the diagram explodes as the section scrolls through the viewport
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 80%",
        end: "bottom 45%",
        scrub: 0.6,
        onUpdate: (self) => {
          stateRef.current.p = self.progress;
        },
      });
      gsap.from(".caps-art", { opacity: 0, duration: 1.4, scrollTrigger: { trigger: ".caps-art", start: "top 85%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section container caps" id="capabilities">
      <SectionMark />
      <div className="caps-copy">
        <Reveal as="p" className="h-3 caps-text" stagger={0.012}>
          I do the whole thing: design when a project needs it, the build, the motion, and the handover so you can run the
          site yourself. WordPress or Webflow when you want to edit it, Next.js when it is a product, and whatever front-end
          framework your team already uses when I am joining one. The choice is about what you will still be maintaining in
          two years.
        </Reveal>
        <p className="caps-note mono">Design · Build · Motion · Handover · React, Vue, Svelte, Astro, plain HTML</p>
      </div>
      <div className="caps-art" aria-hidden="true">
        <div className="caps-canvas">
          <Layers stateRef={stateRef} labels={labelRefs as LayerLabels} />
        </div>
        <ul className="caps-legend mono">
          {["Design", "Build", "Motion", "Handover"].map((name, i) => (
            <li
              key={name}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
