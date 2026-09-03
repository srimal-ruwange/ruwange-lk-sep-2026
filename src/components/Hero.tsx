"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { onReady } from "@/lib/ready";
import { site } from "@/data/site";

const HeroGallery = dynamic(() => import("./three/HeroGallery"), { ssr: false });

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const off = onReady(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.to(".hero-title .line-inner", { y: 0, duration: 1.5, stagger: 0.12 }, 0.1)
          // top stroke first, then the lighter one under it — each drawn as one unbroken line
          .fromTo(".hand-stroke path", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, stagger: 0.3, ease: "power2.inOut" }, 1.05)
          .to(".hero-sub", { opacity: 1, duration: 1 }, 0.9);
      }, root);
      return () => ctx.revert();
    });
    return off;
  }, []);

  return (
    <section ref={root} className="hero" id="hero">
      <div className="container">
        <h1 className="h-display hero-title">
          <span className="line">
            <span className="line-inner">I make the web</span>
          </span>
          <span className="line">
            <span className="line-inner">
              feel{" "}
              <span className="hand">
                <em>handmade</em>
                {/* a pencil underline, drawn in after the word lands */}
                {/* uniform scaling only: non-uniform stretch makes the dash-based draw split mid-word */}
                <svg className="hand-stroke" viewBox="0 0 300 26" aria-hidden="true">
                  <path d="M4 13 C 60 2, 110 22, 160 11 C 210 0, 250 18, 296 12" />
                  <path d="M14 21 C 76 12, 136 27, 200 16 C 240 9, 262 16, 288 20" />
                </svg>
              </span>
            </span>
          </span>
          <span className="line">
            <span className="line-inner">again.</span>
          </span>
        </h1>
      </div>

      <div className="hero-stage">
        <HeroGallery />
      </div>

      <div className="container hero-bottom">
        <p className="lead hero-sub">{site.description}</p>
      </div>
    </section>
  );
}
