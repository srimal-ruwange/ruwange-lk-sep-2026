"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { onReady } from "@/lib/ready";
import { scrollToHash } from "@/lib/lenis";
import { site } from "@/data/site";
import Clock from "./Clock";

const links = [
  { label: "Work", hash: "#work" },
  { label: "About", hash: "#about" },
  { label: "Contact", hash: "#contact" },
];

export default function Header() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const off = onReady(() => gsap.to(el, { opacity: 1, duration: 1, delay: 0.3 }));
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      off();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    scrollToHash(hash);
  };

  return (
    <header ref={ref} className="header">
      <a href="#top" className="header-name" onClick={(e) => go(e, "#top")}>
        {site.name}
      </a>
      <div className="header-clock mono">
        <span className="dot" />
        <span>{site.city}</span>
        <Clock tz={site.timeZone} />
        <span>{site.utc}</span>
      </div>
      <nav className="header-nav mono">
        {links.map((l) => (
          <a key={l.hash} href={l.hash} onClick={(e) => go(e, l.hash)}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
