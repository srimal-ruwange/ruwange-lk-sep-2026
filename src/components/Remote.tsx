"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import SectionMark from "./motion/SectionMark";
import Reveal from "./motion/Reveal";
import Rule from "./motion/Rule";
import { cities, site } from "@/data/site";
import { formatTime, tzDiffLabel, tzOffsetMinutes } from "@/lib/time";

const Globe = dynamic(() => import("./three/Globe"), { ssr: false });

function Clocks() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);
  return (
    <div className="clocks mono">
      {cities.map((c, i) => {
        const hour = now ? (Math.floor((now.getUTCHours() * 60 + now.getUTCMinutes() + tzOffsetMinutes(now, c.tz)) / 60) + 24) % 24 : 12;
        const night = hour < 7 || hour >= 20;
        return (
          <div className={`clock-row ${c.name === site.city ? "is-home" : ""} ${night ? "is-night" : ""}`} key={c.name}>
            <span className="clock-name">{c.name}</span>
            <span className="clock-diff">{now ? tzDiffLabel(now, c.tz, site.timeZone) : ""}</span>
            <span className="clock-time" suppressHydrationWarning>
              {now ? formatTime(now, c.tz, false) : "--:--"}
            </span>
            <Rule delay={i * 0.05} soft />
          </div>
        );
      })}
    </div>
  );
}

export default function Remote() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.from(".remote-globe", {
        opacity: 0,
        scale: 0.92,
        duration: 1.6,
        ease: "power3.out",
        scrollTrigger: { trigger: ".remote-globe", start: "top 80%", once: true },
      });
      gsap.from(".remote-copy .lead", { y: 20, opacity: 0, duration: 1, scrollTrigger: { trigger: ".remote-copy", start: "top 80%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section container" id="remote">
      <SectionMark />
      <div className="remote-grid">
        <div className="remote-copy">
          <Reveal as="h2" className="h-2">
            Working from Colombo. Shipping everywhere.
          </Reveal>
          <p className="lead">
            Sri Lanka sits at {site.utc}. Mornings overlap with Sydney and Singapore, afternoons with Berlin and London, evenings
            with New York. Async by default, on a call when it counts — the time difference has never been the hard part.
          </p>
          <Clocks />
        </div>
        <div className="remote-globe">
          <Globe />
          <span className="tag tr mono">● {site.city}</span>
          <span className="tag bl mono">Drag to rotate</span>
        </div>
      </div>
    </section>
  );
}
