"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { onReady } from "@/lib/ready";

export default function Frame() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const off = onReady(() => {
      const ctx = gsap.context(() => {
        gsap.to(".frame-v", { scaleY: 1, duration: 1.8, ease: "power3.inOut", stagger: 0.1 });
      }, ref);
      return () => ctx.revert();
    });
    return off;
  }, []);
  return (
    <div ref={ref} className="frame" aria-hidden="true">
      <div className="frame-v l" />
      <div className="frame-v r" />
    </div>
  );
}
