export const site = {
  name: "Srimal Ruwange",
  role: "Creative Developer",
  url: "https://ruwange.lk",
  city: "Colombo",
  country: "Sri Lanka",
  timeZone: "Asia/Colombo",
  utc: "UTC+5:30",
  coords: { lat: 6.9271, lon: 79.8612, label: "6.9271° N, 79.8612° E" },
  description:
    "Motion-led websites, built with the care of someone who spent years keeping large web apps alive. Working remotely from Colombo, Sri Lanka.",
  social: {
    linkedin: "https://www.linkedin.com/in/srimalruwange/",
  },
};

export type Project = {
  id: string;
  index: string;
  title: string;
  url?: string;
  tags: string[];
  description: string;
  image: string;
};

export const projects: Project[] = [
  {
    id: "future-state",
    index: "01",
    title: "Future State",
    url: "https://futurestatedigital.com",
    tags: ["Branding", "WebGL", "GSAP", "Next.js"],
    description:
      "A founder-led product & platform consultancy. Branding and a motion-led site — WebGL particle trail, GSAP scroll storytelling — framing how they build, modernize, and scale digital products.",
    image: "/images/work-future-state.webp",
  },
  {
    id: "dreamstart-labs",
    index: "02",
    title: "DreamStart Labs",
    url: "https://dreamstartlabs.com",
    tags: ["WebGL", "GSAP", "WordPress"],
    description:
      "A social-impact venture digitizing informal savings groups worldwide. A warm, motion-led WordPress site — WebGL globe, GSAP scroll storytelling, animated impact stats — showing how communities unlock financial freedom at scale.",
    image: "/images/work-dreamstart.webp",
  },
  {
    id: "asaya-sands",
    index: "03",
    title: "Asaya Sands",
    url: "https://asaya.lk",
    tags: ["GSAP", "WordPress"],
    description:
      "A live-work-play boutique retreat by the beach in Mirissa, Sri Lanka. A serene, scroll-led WordPress site — GSAP transitions and full-bleed imagery — inviting guests to stay, work, and dine by the sea.",
    image: "/images/work-asaya.jpg",
  },
  {
    id: "sudath-perera-associates",
    index: "04",
    title: "Sudath Perera Associates",
    url: "https://sudathpereraassociates.com/",
    tags: ["WordPress", "Design", "Content structure"],
    description:
      "A full-service Sri Lankan law firm. A confident WordPress build — large editorial type over full-bleed photography, clear practice areas and team pages, and a content structure the firm can maintain themselves.",
    image: "/images/work-spa.jpg",
  },
  {
    id: "this-portfolio",
    index: "05",
    title: "This Portfolio",
    url: "https://ruwange.lk",
    tags: ["Next.js", "GSAP", "Three.js", "Shaders"],
    description:
      "The site you're on. Paper, ink and a lot of WebGL — a velocity-driven project reel, a pencil sketch that draws itself, an ink-wash plate viewer and a live globe. Built to prove the work, not just describe it.",
    image: "/images/work-portfolio-2026.jpg",
  },
];

/** Extra sites that appear in the hero reel only (not in the Selected Work plates). */
export type ReelItem = { id: string; title: string; url: string; image: string };

export const reelExtras: ReelItem[] = [
  { id: "trail", title: "Trail — Walk · Unite · Heal", url: "https://www.trailsl.com/", image: "/images/reel-trailsl.jpg" },
  { id: "calcey", title: "Calcey", url: "https://calcey.com/", image: "/images/reel-calcey.jpg" },
  { id: "old-portfolio", title: "Old Portfolio", url: "", image: "/images/work-portfolio.jpg" },
];

/** Everything the hero reel shows: the selected work first, then the extras. */
export const reel: ReelItem[] = [
  ...projects.map((p) => ({ id: p.id, title: p.title, url: p.url ?? "", image: p.image })),
  ...reelExtras,
];

export type Capability = {
  index: string;
  title: string;
  stack: string[];
  description: string;
};

export const capabilities: Capability[] = [
  {
    index: "01",
    title: "Creative Development",
    stack: ["WebGL", "GSAP", "React", "Three.js"],
    description:
      "Interactive, performance-minded front-ends where motion and 3D are first-class — real-time WebGL scenes, scroll-driven storytelling and component architectures that stay clean as they scale.",
  },
  {
    index: "02",
    title: "Motion & Interaction",
    stack: ["Shaders", "Timeline", "Scroll", "Lenis"],
    description:
      "Custom shaders, timeline choreography and scroll-linked sequences that make a page feel alive — every transition tuned for rhythm, weight and intent, never decoration for its own sake.",
  },
  {
    index: "03",
    title: "Art Direction",
    stack: ["Brand", "Type", "Layout", "Colour"],
    description:
      "Setting the visual system — type pairings, colour, grid and tone — so a product reads as one confident voice from the first frame to the last small detail.",
  },
  {
    index: "04",
    title: "CMS & No-code",
    stack: ["Webflow", "WordPress", "Headless", "CMS"],
    description:
      "Comfortable across the CMS landscape — Webflow, WordPress and headless setups alike. Clean content models, tidy handoff and editor-friendly structures, so teams can ship and update confidently whatever the platform.",
  },
  {
    index: "05",
    title: "Frontend Engineering",
    stack: ["HTML", "CSS", "JS", "React", "Next.js"],
    description:
      "Semantic, accessible, responsive front-ends on React and Next.js — fast, resilient and pixel-faithful to the design across every breakpoint and device.",
  },
];

export type City = { name: string; tz: string; lat: number; lon: number };

export const cities: City[] = [
  { name: "Colombo", tz: "Asia/Colombo", lat: 6.9271, lon: 79.8612 },
  { name: "London", tz: "Europe/London", lat: 51.5074, lon: -0.1278 },
  { name: "Berlin", tz: "Europe/Berlin", lat: 52.52, lon: 13.405 },
  { name: "Dubai", tz: "Asia/Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", tz: "Asia/Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Sydney", tz: "Australia/Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "New York", tz: "America/New_York", lat: 40.7128, lon: -74.006 },
  { name: "San Francisco", tz: "America/Los_Angeles", lat: 37.7749, lon: -122.4194 },
];
