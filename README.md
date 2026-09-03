# ruwange.lk — portfolio

Creative-developer portfolio for Srimal Ruwange. Next.js 16 (App Router) + GSAP (ScrollTrigger, SplitText) + Lenis + Three.js / React Three Fiber, with a Resend-powered contact form.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in the Resend values
npm run dev
```

## Environment

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key used by `src/app/api/contact/route.ts` |
| `CONTACT_TO_EMAIL` | Inbox that receives enquiries |
| `CONTACT_FROM_EMAIL` | Verified Resend sender, e.g. `Srimal Ruwange <hello@ruwange.lk>` |

## Structure

- `src/data/site.ts` — all copy, projects, capabilities, cities (edit content here)
- `src/components/` — one file per section (`Hero`, `About`, `Paradise` (sunset scene + live sun times for Colombo), `Work`, `Capabilities`, `Remote`, `Contact`, `Footer`)
- `src/components/three/` — WebGL: `HeroGallery` (shader project reel), `ParadiseScene` (pencil sketch that draws itself over a live sunset wash, from `public/images/sketch-veranda.jpg`), `WorkViewer` (ink-dissolve plate viewer for Selected Work), `Globe` (ink-line globe with arcs)
- `src/components/motion/` — `Reveal` (SplitText reveals), `Rule` (self-drawing lines), `SectionLabel`
- `src/lib/` — GSAP registration, Lenis store, preloader "ready" bus, time-zone helpers
- `src/app/globals.css` — design tokens and all section styles
