"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = { className?: string; vertical?: boolean; delay?: number; duration?: number; soft?: boolean; start?: string };

/** A 1px line that draws itself in when scrolled into view. */
export default function Rule({ className = "", vertical, delay = 0, duration = 1.4, soft, start = "top 92%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const el = ref.current!;
    gsap.fromTo(
      el,
      vertical ? { scaleY: 0 } : { scaleX: 0 },
      {
        scaleX: 1,
        scaleY: 1,
        duration,
        delay,
        ease: "power3.inOut",
        scrollTrigger: { trigger: el, start, once: true },
      },
    );
  });
  return <div ref={ref} className={`rule ${vertical ? "rule--v" : ""} ${soft ? "rule--soft" : ""} ${className}`} />;
}
