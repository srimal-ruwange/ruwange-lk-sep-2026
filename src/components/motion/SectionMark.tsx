"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Section separator: a hairline that draws across the top of the section as it comes into view. */
export default function SectionMark({ className = "" }: { word?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      gsap.fromTo(el.querySelector(".smark-rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`smark ${className}`} aria-hidden="true">
      <span className="smark-rule" />
    </div>
  );
}
