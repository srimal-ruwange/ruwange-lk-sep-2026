"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
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
      const header = document.querySelector<HTMLElement>(".header");
      // The section is a dark panel: a small tilted, rounded window in the middle of the screen
      // grows to fill it as the section approaches. The content is laid out full-size the whole
      // time and simply shows through the window, so nothing inside ever scales or moves.
      // Timeline units: one unit per project, with a short hold at either end.
      const HOLD = 0.12;
      const TOTAL = HOLD + n + HOLD;
      const unit = () => window.innerHeight * 1.1;
      const slides = gsap.utils.toArray<HTMLElement>(".work-slide");
      const ticks = gsap.utils.toArray<HTMLElement>(".work-tick");
      let current = -1;

      // v = 0 is the small tilted window, v = 1 is the full screen. The window is a clip-path on
      // the pinned block: a rounded rectangle, rotated, centred, built in pixels every frame.
      // tilt: the window leans one way on the approach and the other way on the exit
      const panel = { v: 0, tilt: -6 };
      const paint = () => {
        const v = panel.v;
        const W = pin.offsetWidth;
        const H = pin.offsetHeight;
        const sc = 0.34 + 0.66 * v;
        const w = W * sc;
        const h = H * sc;
        const th = (panel.tilt * (1 - v) * Math.PI) / 180;
        const r = Math.min(28 * (1 - v), w / 2, h / 2);
        const cos = Math.cos(th);
        const sin = Math.sin(th);
        const pt = (x: number, y: number) =>
          `${(W / 2 + x * cos - y * sin).toFixed(2)} ${(H / 2 + x * sin + y * cos).toFixed(2)}`;
        const arc = (x: number, y: number) =>
          `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${pt(x, y)}`;
        const hw = w / 2;
        const hh = h / 2;
        const d =
          `M ${pt(-hw + r, -hh)} L ${pt(hw - r, -hh)} ${arc(hw, -hh + r)} ` +
          `L ${pt(hw, hh - r)} ${arc(hw - r, hh)} L ${pt(-hw + r, hh)} ${arc(-hw, hh - r)} ` +
          `L ${pt(-hw, -hh + r)} ${arc(-hw + r, -hh)} Z`;
        pin.style.clipPath = `path("${d}")`;
        // hand the header over to ink once the window's top edge passes under it
        const top = (H * (1 - sc)) / 2;
        const headerH = header?.offsetHeight ?? 72;
        header?.classList.toggle("is-ink", v > 0.5 && top < headerH);
      };
      paint();

      // The window's state is driven straight from scroll progress (not tweens) so the approach
      // and the exit can't fight over the same value.
      const ease = gsap.parseEase("power2.inOut");

      // 1. the window grows while the section scrolls into view, so it is full-screen the moment it pins
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 85%",
        end: "top top",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          panel.tilt = -6;
          panel.v = ease(self.progress);
          paint();
        },
      });

      // 2. pinned: a short hold, the plates, a short hold
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => "+=" + TOTAL * unit(),
          pin: true,
          pinSpacing: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // plate progress only counts the middle phase
            const p = gsap.utils.clamp(
              0,
              1,
              (self.progress * TOTAL - HOLD) / n,
            );
            progressRef.current.p = p;
            const i = Math.min(
              n - 1,
              Math.floor(p * n + (1 - SWAP_START) * 0.5),
            );
            if (i !== current) {
              current = i;
              const proj = projects[i];
              if (captionRef.current)
                captionRef.current.textContent = proj.title;
              if (linkRef.current) {
                if (proj.url) {
                  linkRef.current.href = proj.url;
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
      const at0 = HOLD;

      // 3. released: the window shrinks back to the tilted state as the section scrolls away
      ScrollTrigger.create({
        trigger: pin,
        start: () => tl.scrollTrigger!.end,
        end: () => "+=" + window.innerHeight * 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          panel.tilt = 6;
          panel.v = 1 - ease(self.progress);
          paint();
        },
      });

      // progress rule
      tl.fromTo(
        ".work-progress",
        { scaleX: 0 },
        { scaleX: 1, duration: n },
        at0,
      );
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
          const at = at0 + i;
          tl.set(slide, { autoAlpha: 1 }, at);
          tl.fromTo(
            lines,
            { yPercent: 120 },
            { yPercent: 0, duration: 0.16, stagger: 0.03, ease: "power3.out" },
            at + 0.02,
          );
          tl.fromTo(
            rest,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.14,
              stagger: 0.02,
              ease: "power2.out",
            },
            at + 0.08,
          );
        }
        if (i < n - 1) {
          const out = at0 + i + SWAP_START;
          tl.to(
            lines,
            {
              yPercent: -120,
              duration: 0.14,
              stagger: 0.02,
              ease: "power3.in",
            },
            out,
          );
          tl.to(
            rest,
            { autoAlpha: 0, y: -14, duration: 0.12, ease: "power2.in" },
            out,
          );
          tl.set(slide, { autoAlpha: 0 }, out + 0.2);
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="work" id="work">
      <div className="work-pin">
        <div className="work-card" aria-hidden="true" />
        <div className="work-panel">
          <div className="work-side">
            <div className="work-head">
              <h2 className="h-3">Selected work</h2>
            </div>

            <div className="work-body">
              <div className="work-slides">
                {projects.map((p) => (
                  <article
                    className="work-slide"
                    id={`work-${p.id}`}
                    key={p.id}
                    style={{ opacity: 0, visibility: "hidden" }}
                  >
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
                        <a
                          className="link mono"
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit site <span className="arrow">↗</span>
                        </a>
                      ) : (
                        <span className="mono work-retired">
                          Retired · 2026
                        </span>
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
                  <span
                    className={`work-tick ${i === 0 ? "is-on" : ""}`}
                    key={p.id}
                  >
                    {p.index}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <a
            ref={linkRef}
            className="work-plate"
            href={projects[0].url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the current project"
          >
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
      </div>
    </section>
  );
}
