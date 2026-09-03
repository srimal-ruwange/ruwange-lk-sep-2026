"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToHash } from "@/lib/lenis";
import { site } from "@/data/site";
import Rule from "./motion/Rule";

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.from(".footer-big span", { yPercent: 130, duration: 1.4, ease: "power4.out", scrollTrigger: { trigger: ".footer-big", start: "top 95%", once: true } });
    },
    { scope: root },
  );
  return (
    <footer ref={root} className="footer container">
      <div className="footer-big" aria-hidden="true">
        <span>Ruwange</span>
      </div>
      {/* sits at the very bottom of the page, so trigger as soon as it enters the viewport */}
      <Rule start="top bottom" />
      <div className="footer-row mono">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>{site.city} · Worldwide</span>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToHash("#top");
          }}
        >
          ↑ Back to top
        </a>
      </div>
    </footer>
  );
}
