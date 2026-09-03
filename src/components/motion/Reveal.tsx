"use client";

import { createElement, useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  delay?: number;
  stagger?: number;
  start?: string;
  /** "words" masks each line and slides words up; "scrub" fades words in as you scroll (Boring-style). */
  mode?: "words" | "scrub";
};

export default function Reveal({ as = "p", className, children, delay = 0, stagger = 0.02, start = "top 85%", mode = "words" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      let split: SplitText | undefined;
      const run = () => {
        if (mode === "scrub") {
          split = SplitText.create(el, {
            type: "words",
            wordsClass: "w",
            autoSplit: true,
            onSplit(self) {
              gsap.set(el, { visibility: "visible" });
              return gsap.fromTo(
                self.words,
                { opacity: 0.14 },
                {
                  opacity: 1,
                  ease: "none",
                  stagger: 0.06,
                  scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 55%", scrub: true },
                },
              );
            },
          });
        } else {
          split = SplitText.create(el, {
            type: "lines,words",
            mask: "lines",
            linesClass: "sl",
            autoSplit: true,
            onSplit(self) {
              // only show the element once its words are already parked below the mask
              const tween = gsap.from(self.words, {
                // past 100% + the mask's descender padding, so nothing peeks before the reveal
                yPercent: 140,
                duration: 1.2,
                ease: "power4.out",
                stagger,
                delay,
                scrollTrigger: { trigger: el, start, once: true },
              });
              gsap.set(el, { visibility: "visible" });
              return tween;
            },
          });
        }
      };
      document.fonts.ready.then(run);
      return () => split?.revert();
    },
    { scope: ref, dependencies: [mode] },
  );

  // hidden until SplitText has split and parked the words, so unsplit text never flashes
  // eslint-disable-next-line react-hooks/refs -- ref object is only forwarded, not read
  return createElement(as, { ref, className, style: { visibility: "hidden" } }, children);
}
