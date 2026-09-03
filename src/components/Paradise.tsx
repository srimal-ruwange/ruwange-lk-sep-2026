"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToHash } from "@/lib/lenis";
import { site } from "@/data/site";
import { formatTime } from "@/lib/time";
import { solarTimes, localNoon, formatCountdown } from "@/lib/sun";
import SectionMark from "./motion/SectionMark";
import Reveal from "./motion/Reveal";
import Rule from "./motion/Rule";
import type { ParadiseState } from "./three/ParadiseScene";

const ParadiseScene = dynamic(() => import("./three/ParadiseScene"), { ssr: false });

/** Live sun facts for Colombo: sunrise, sunset and what's next. */
function SunFacts() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  let sunrise = "--:--";
  let sunset = "--:--";
  let next = { label: "Next", value: "—" };
  if (now) {
    const { sunrise: r, sunset: s } = solarTimes(localNoon(now, site.timeZone), site.coords.lat, site.coords.lon);
    sunrise = formatTime(r, site.timeZone, false);
    sunset = formatTime(s, site.timeZone, false);
    const golden = s.getTime() - 60 * 60000;
    if (now.getTime() < r.getTime()) next = { label: "Sunrise in", value: formatCountdown(r.getTime() - now.getTime()) };
    else if (now.getTime() < golden) next = { label: "Golden hour in", value: formatCountdown(golden - now.getTime()) };
    else if (now.getTime() < s.getTime()) next = { label: "Golden hour", value: "Now" };
    else {
      const tomorrow = solarTimes(localNoon(now, site.timeZone, 1), site.coords.lat, site.coords.lon);
      next = { label: "Sunrise in", value: formatCountdown(tomorrow.sunrise.getTime() - now.getTime()) };
    }
  }

  const cells = [
    { k: "Local time", v: now ? formatTime(now, site.timeZone, false) : "--:--" },
    { k: "Sunrise", v: sunrise },
    { k: "Sunset", v: sunset },
    { k: next.label, v: next.value },
  ];

  return (
    <dl className="para-facts mono">
      {cells.map((c, i) => (
        <div className="para-fact" key={c.k}>
          <Rule delay={i * 0.08} />
          <dt>{c.k}</dt>
          <dd suppressHydrationWarning>{c.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Paradise() {
  const root = useRef<HTMLElement>(null);
  const stateRef = useRef<ParadiseState>({ reveal: 0, sun: 0, par: 0.5 });

  useGSAP(
    () => {
      const art = root.current!.querySelector<HTMLElement>(".para-art")!;
      // the drawing sketches itself in once, as the panel comes into view
      gsap.to(stateRef.current, {
        reveal: 1,
        duration: 3.2,
        ease: "power2.inOut",
        scrollTrigger: { trigger: art, start: "top 78%", once: true },
      });
      // the sun sets and the print drifts as the section scrolls by (no pinning)
      gsap.to(stateRef.current, {
        sun: 1,
        par: 1,
        ease: "none",
        scrollTrigger: { trigger: art, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.from(".para-art", { y: 40, opacity: 0, duration: 1.2, scrollTrigger: { trigger: art, start: "top 88%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section para container" id="paradise" aria-label="Based in Sri Lanka">
      <SectionMark />

      <div className="para-head">
        <Reveal as="h2" className="h-2 para-title">
          Palm trees out front. Fibre out back.
        </Reveal>
        <div className="para-copy">
          <p className="lead">
            Colombo, Sri Lanka. Born here, still here. I work from home for teams anywhere: the light is gold by five,
            the time zone touches everyone&apos;s working day, and every site I make starts at this desk.
          </p>
          <a
            className="link mono"
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToHash("#contact");
            }}
          >
            Start a project <span className="arrow">↗</span>
          </a>
        </div>
      </div>

      <div className="para-art" role="img" aria-label="Pencil drawing of a desk on a veranda overlooking the sea in Sri Lanka, with the sun setting over the water">
        <ParadiseScene src="/images/sketch-veranda.jpg" stateRef={stateRef} />
        <span className="para-corner tl" />
        <span className="para-corner tr" />
        <span className="para-corner bl" />
        <span className="para-corner br" />
        <span className="para-caption mono">The office · {site.coords.label}</span>
      </div>

      <SunFacts />
    </section>
  );
}
