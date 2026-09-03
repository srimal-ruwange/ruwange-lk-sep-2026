"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { site } from "@/data/site";
import { formatTime } from "@/lib/time";
import { solarTimes, localNoon, formatCountdown } from "@/lib/sun";
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

  return (
    <p className="para-sun mono">
      <span>{now ? formatTime(now, site.timeZone, false) : "--:--"} in {site.city}</span>
      <span>Sunrise {sunrise}</span>
      <span>Sunset {sunset}</span>
      <span>
        {next.label} {next.value}
      </span>
    </p>
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
    },
    { scope: root },
  );

  return (
    <section ref={root} className="para" id="paradise" aria-label="Based in Sri Lanka">
      <div className="para-art" role="img" aria-label="Pencil drawing of a desk on a veranda overlooking the sea in Sri Lanka, with the sun setting over the water">
        <ParadiseScene src="/images/sketch-veranda.jpg" stateRef={stateRef} />
      </div>

      <div className="container para-below">
        <p className="para-line serif">
          Palm trees out front. <em>Fibre out back.</em>
        </p>
        <div className="para-copy">
          <p className="lead">
            Colombo, Sri Lanka. Born here, still here. I work from home for teams anywhere: the light is gold by five,
            the time zone touches everyone&apos;s working day, and every site I make starts at this desk.
          </p>
          <SunFacts />
        </div>
      </div>
    </section>
  );
}
