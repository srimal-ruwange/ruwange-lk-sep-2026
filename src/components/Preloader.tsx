"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { withLenis } from "@/lib/lenis";
import { markReady } from "@/lib/ready";
import { site } from "@/data/site";

const STEPS = [
  "Loading typefaces",
  "Compiling shaders",
  `Locating ${site.coords.label}`,
  `Syncing ${site.city} time · ${site.utc}`,
  "Drawing lines",
  "Ready",
];

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    withLenis((l) => l.stop());
    window.scrollTo(0, 0);
    let ctx: gsap.Context | undefined;
    let cancelled = false;

    const start = () => {
      if (cancelled || !root.current) return;
      ctx = gsap.context(() => {
        const rows = gsap.utils.toArray<HTMLElement>(".pl-row");
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete() {
            withLenis((l) => l.start());
            markReady();
            ScrollTrigger.refresh();
            setDone(true);
          },
        });
        tl.to(".pl-name span", { y: 0, duration: 1.1, ease: "power4.out" }, 0);
        rows.forEach((row, i) => {
          tl.to(row, { opacity: 1, duration: 0.01 }, 0.25 + i * 0.22);
          tl.fromTo(row.querySelector(".pl-ok"), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.25 + i * 0.22 + 0.16);
        });
        tl.to(".pl-bar", { scaleX: 1, duration: 0.25 + rows.length * 0.22 + 0.2, ease: "power2.inOut" }, 0);
        tl.to(".pl-rows, .pl-top, .pl-bottom", { opacity: 0, duration: 0.4, ease: "power2.in" }, "+=0.25");
        tl.to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.15, ease: "power4.inOut" }, "<0.1");
      }, root);
    };

    Promise.all([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 150))]).then(start);

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="preloader" style={{ clipPath: "inset(0 0 0% 0)" }} aria-hidden="true">
      <div className="pl-top mono">
        <span>{site.role}</span>
        <span>
          {site.city} · {site.utc}
        </span>
      </div>
      <div className="pl-rows mono">
        {STEPS.map((s, i) => (
          <div className="pl-row" key={s}>
            <span className="pl-n">{String(i + 1).padStart(3, "0")}</span>
            <span>{s}</span>
            <span className="pl-ok">OK</span>
          </div>
        ))}
      </div>
      <div className="pl-bottom">
        <div className="pl-name">
          <span>{site.name}</span>
        </div>
        <div className="pl-bar-wrap">
          <div className="pl-bar" />
        </div>
      </div>
    </div>
  );
}
