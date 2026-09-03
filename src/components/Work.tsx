"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { inkWhileInView } from "@/lib/ink";
import { projects } from "@/data/site";
import { SWAP_START } from "./three/WorkViewer";

const WorkViewer = dynamic(() => import("./three/WorkViewer"), { ssr: false });

const n = projects.length;

export default function Work() {
  const root = useRef<HTMLElement>(null);
  const progressRef = useRef({ p: 0 });
  const captionRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const pin = root.current!.querySelector<HTMLElement>(".work-pin")!;
      // ink mode from half a screen before the pin engages until half a screen after it releases.
      // Measured as an explicit distance from the pinned block: the section's own height is
      // measured before pin spacing exists, so "bottom" would land far too early.
      const pinDistance = () => window.innerHeight * n * 1.1;
      const stopInk = inkWhileInView("work", pin, { start: "top 55%", end: () => "+=" + (pinDistance() + window.innerHeight * 1.1) });
      const slides = gsap.utils.toArray<HTMLElement>(".work-slide");
      const ticks = gsap.utils.toArray<HTMLElement>(".work-tick");
      let current = -1;

      // One unit of timeline per project; the last ~22% of each unit is the dissolve into the next.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => "+=" + pinDistance(),
          pin: true,
          pinSpacing: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progressRef.current.p = self.progress;
            const i = Math.min(n - 1, Math.floor(self.progress * n + (1 - SWAP_START) * 0.5));
            if (i !== current) {
              current = i;
              const p = projects[i];
              if (captionRef.current) captionRef.current.textContent = p.title;
              if (linkRef.current) {
                if (p.url) {
                  linkRef.current.href = p.url;
                  linkRef.current.classList.remove("is-static");
                } else {
                  linkRef.current.removeAttribute("href");
                  linkRef.current.classList.add("is-static");
                }
              }
              ticks.forEach((t, k) => t.classList.toggle("is-on", k === i));
            }
          },
        },
      });

      // progress rule
      tl.fromTo(".work-progress", { scaleX: 0 }, { scaleX: 1, duration: n }, 0);
      // all titles start hidden below their masks (set here, not in CSS, so GSAP owns the transform)
      gsap.set(".work-title .line-inner", { yPercent: 120, y: 0, x: 0 });

      slides.forEach((slide, i) => {
        const lines = slide.querySelectorAll<HTMLElement>(".line-inner");
        const rest = slide.querySelectorAll<HTMLElement>(".work-rest > *");
        if (i === 0) {
          gsap.set(slide, { autoAlpha: 1 });
          gsap.set(lines, { yPercent: 0 });
          gsap.set(rest, { autoAlpha: 1, y: 0 });
        } else {
          const at = i;
          tl.set(slide, { autoAlpha: 1 }, at);
          tl.fromTo(lines, { yPercent: 120 }, { yPercent: 0, duration: 0.16, stagger: 0.03, ease: "power3.out" }, at + 0.02);
          tl.fromTo(rest, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.02, ease: "power2.out" }, at + 0.08);
        }
        if (i < n - 1) {
          const out = i + SWAP_START;
          tl.to(lines, { yPercent: -120, duration: 0.14, stagger: 0.02, ease: "power3.in" }, out);
          tl.to(rest, { autoAlpha: 0, y: -14, duration: 0.12, ease: "power2.in" }, out);
          tl.set(slide, { autoAlpha: 0 }, out + 0.2);
        }
      });
      return stopInk;
    },
    { scope: root },
  );

  return (
    <section ref={root} className="work" id="work">
      <div className="work-pin">
        <div className="work-side">
          <div className="work-head">
            <h2 className="h-3">Selected work</h2>
          </div>

          <div className="work-body">
            <div className="work-slides">
              {projects.map((p) => (
                <article className="work-slide" id={`work-${p.id}`} key={p.id} style={{ opacity: 0, visibility: "hidden" }}>
                  <span className="mono work-num">Project {p.index}</span>
                  <h3 className="work-title">
                    {p.title.split(" ").map((word, k) => (
                      <span className="line" key={k}>
                        <span className="line-inner">{word}</span>
                      </span>
                    ))}
                  </h3>
                  <div className="work-rest">
                    <p className="body">{p.description}</p>
                    <ul className="work-tags mono">
                      {p.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    {p.url ? (
                      <a className="link mono" href={p.url} target="_blank" rel="noreferrer">
                        Visit site <span className="arrow">↗</span>
                      </a>
                    ) : (
                      <span className="mono work-retired">Retired · 2026</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="work-foot mono">
            <div className="work-progress-wrap">
              <div className="work-progress" />
            </div>
            <div className="work-ticks">
              {projects.map((p, i) => (
                <span className={`work-tick ${i === 0 ? "is-on" : ""}`} key={p.id}>
                  {p.index}
                </span>
              ))}
            </div>
          </div>
        </div>

        <a ref={linkRef} className="work-plate" href={projects[0].url} target="_blank" rel="noreferrer" aria-label="Open the current project">
          <WorkViewer progressRef={progressRef} />
          <span className="para-corner tl" />
          <span className="para-corner tr" />
          <span className="para-corner bl" />
          <span className="para-corner br" />
          <span className="work-caption mono" ref={captionRef}>
            {projects[0].title}
          </span>
          <span className="work-caption right mono work-open">Open ↗</span>
        </a>
      </div>
    </section>
  );
}
