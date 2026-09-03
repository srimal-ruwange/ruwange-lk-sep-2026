"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import SectionMark from "./motion/SectionMark";
import Reveal from "./motion/Reveal";
import Rule from "./motion/Rule";
import Clock from "./Clock";
import { site } from "@/data/site";

const facts: { k: string; v: string | null; href?: string }[] = [
  { k: "Based", v: `${site.city}, ${site.country}` },
  { k: "Local time", v: null },
  { k: "Working", v: "Remote · async-first · worldwide" },
  { k: "Focus", v: "WebGL · GSAP · Next.js · Shaders" },
  { k: "Freelance", v: "A couple of projects a year, chosen carefully" },
  { k: "Elsewhere", v: "LinkedIn", href: site.social.linkedin },
];

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {

      gsap.utils.toArray<HTMLElement>(".about-facts .row").forEach((row, i) => {
        gsap.from(row.children, {
          y: 14,
          opacity: 0,
          duration: 0.9,
          delay: i * 0.06,
          scrollTrigger: { trigger: row, start: "top 90%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".about-copy p").forEach((p, i) => {
        gsap.from(p, { y: 24, opacity: 0, duration: 1.1, delay: i * 0.1, scrollTrigger: { trigger: p, start: "top 88%", once: true } });
      });
      // portrait: unveils from the top like a plate being uncovered, then drifts slower than the page
      const portrait = root.current!.querySelector<HTMLElement>(".about-portrait");
      if (portrait) {
        gsap.fromTo(
          portrait,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 1.6, ease: "power3.inOut", scrollTrigger: { trigger: portrait, start: "top 82%", once: true } },
        );
        gsap.fromTo(
          portrait.querySelector("img"),
          // the image is 150% of the frame, so it can travel ~30% without showing an edge
          { yPercent: -31 },
          { yPercent: -3, ease: "none", scrollTrigger: { trigger: portrait, start: "top bottom", end: "bottom top", scrub: true } },
        );
        gsap.from(".about-portrait-caption", { opacity: 0, y: 8, duration: 1, delay: 0.6, scrollTrigger: { trigger: portrait, start: "top 82%", once: true } });
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section about container" id="about">
      <SectionMark />

      <Reveal as="p" className="h-2 about-lead" mode="scrub">
        I&apos;m Srimal. By day I build web applications at a large software company. Evenings and weekends, I build
        websites for other people, because I like making something new.
      </Reveal>

      <div className="about-grid">
        <figure className="about-figure">
          <div className="about-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/srimal.jpg" alt="Portrait of Srimal Ruwange, painted in the manner of a Renaissance master" loading="lazy" />
            <span className="para-corner tl" />
            <span className="para-corner tr" />
            <span className="para-corner bl" />
            <span className="para-corner br" />
          </div>
          <figcaption className="about-portrait-caption mono">
            <span>Srimal Ruwange</span>
            <span>{site.city}, {new Date().getFullYear()}</span>
          </figcaption>
        </figure>

        <div className="about-body">
        <div className="about-copy">
          <p>
            I like my day job. It is long-running product work: the same application, year after year, kept healthy and
            growing for people who depend on it. That teaches you a lot about what holds up. It also means most weeks look
            like the week before.
          </p>
          <p>
            Freelance is where I go to do something different. A new brand, a blank page, a chance to try an idea I have been
            sitting on. I take a couple of projects a year, on my own time, and I pick the ones I actually want to build.
            The result is work I care about, done by someone who is not in a hurry.
          </p>
          <p>
            I build with AI as a second pair of hands. It writes a lot of the first draft; I decide what gets built, what gets
            thrown away, and whether it&apos;s actually good. This site was made that way, in days rather than weeks.
          </p>
        </div>

        <dl className="about-facts mono">
          {facts.map((f, i) => (
            <div className="row" key={f.k}>
              {i === 0 && <Rule className="rule--top" />}
              <dt>{f.k}</dt>
              <dd>
                {f.href ? (
                  <a className="link about-link" href={f.href} target="_blank" rel="noreferrer me">
                    {f.v} <span className="arrow">↗</span>
                  </a>
                ) : (
                  (f.v ?? <Clock tz={site.timeZone} />)
                )}
              </dd>
              <Rule delay={i * 0.08} />
            </div>
          ))}
        </dl>
        </div>
      </div>
    </section>
  );
}
