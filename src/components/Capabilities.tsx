"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import SectionMark from "./motion/SectionMark";
import Rule from "./motion/Rule";
import { capabilities } from "@/data/site";

export default function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number>(0);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".cap-head").forEach((head, i) => {
        gsap.from(head.children, {
          y: 22,
          opacity: 0,
          duration: 1,
          stagger: 0.05,
          delay: i * 0.05,
          scrollTrigger: { trigger: head, start: "top 90%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section container" id="capabilities">
      <SectionMark />
      <h2 className="h-3 sec-title">What I do, end to end.</h2>
      <div className="caps-list">
        {capabilities.map((c, i) => {
          const isOpen = open === i;
          return (
            <div
              className={`cap ${isOpen ? "is-open" : ""}`}
              key={c.index}
              // pointer devices expand on hover; touch keeps click-to-toggle
              onMouseEnter={canHover ? () => setOpen(i) : undefined}
            >
              <Rule delay={i * 0.08} />
              <button
                className="cap-head"
                onClick={() => setOpen(isOpen && !canHover ? -1 : i)}
                onFocus={() => setOpen(i)}
                aria-expanded={isOpen}
                aria-controls={`cap-${c.index}`}
              >
                <span className="cap-n mono">{c.index}</span>
                <h3 className="serif">{c.title}</h3>
                <span className="cap-marquee mono" aria-hidden="true">
                  <span className="cap-marquee-track">
                    {[...c.stack, ...c.stack].map((s, k) => (
                      <span key={k}>{s}</span>
                    ))}
                  </span>
                </span>
                <span className="cap-plus" aria-hidden="true" />
              </button>
              <div className="cap-body" id={`cap-${c.index}`}>
                <div>
                  <p>{c.description}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div className="caps-foot mono">
          <Rule />
          <span>{canHover ? "Hover a row to expand" : "Tap a row to expand"}</span>
          <span>Five things, done properly</span>
        </div>
      </div>
    </section>
  );
}
