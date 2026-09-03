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
  { k: "Status", v: "Part-time freelance · taking projects" },
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
        I&apos;m Srimal. After a long stretch building web apps inside a large software company, I now take on a few
        freelance projects a year — sites with real motion, built carefully, from Colombo.
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
            For most of my career I worked on long-running web applications: products that had to keep working, keep evolving
            and keep their users for years. That is the discipline I bring to a portfolio site or a brand launch. The
            expressive part is only worth doing if it is still solid in year three.
          </p>
          <p>
            I&apos;ve recently gone part-time freelance, so I take a small number of projects at a time and stay close to each
            one. If you want a site that moves, loads fast and doesn&apos;t fall apart when the next feature lands, we should
            talk.
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
