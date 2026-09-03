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
    "Websites with real motion, built carefully in Colombo, Sri Lanka. Day job: large web applications. Evenings: the fun stuff.",
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
      "A consultancy run by its founders, so the site had to sound like them: direct, technical, a little ambitious. I did the brand as well as the build. The particle trail in the hero is the thing people ask about; the scroll story underneath it is the thing that does the selling.",
    image: "/images/work-future-state.webp",
  },
  {
    id: "dreamstart-labs",
    index: "02",
    title: "DreamStart Labs",
    url: "https://dreamstartlabs.com",
    tags: ["WebGL", "GSAP", "WordPress"],
    description:
      "They digitise informal savings groups in places most software ignores. The brief was warmth first, technology second. WordPress so their team can publish from anywhere, a small WebGL globe for the countries they work in, and impact numbers that count up as you reach them.",
    image: "/images/work-dreamstart.webp",
  },
  {
    id: "asaya-sands",
    index: "03",
    title: "Asaya Sands",
    url: "https://asaya.lk",
    tags: ["GSAP", "WordPress"],
    description:
      "A place to stay, work and eat by the sea in Mirissa. Big photographs, slow transitions, not much text. Built on WordPress so the owners can swap the season's images themselves. A short description, because the site is.",
    image: "/images/work-asaya.jpg",
  },
  {
    id: "sudath-perera-associates",
    index: "04",
    title: "Sudath Perera Associates",
    url: "https://sudathpereraassociates.com/",
    tags: ["WordPress", "Design", "Content structure"],
    description:
      "A law firm's website usually looks like a law firm's website. This one opens on a night-market photograph and a headline about zoning. Large serif type, clear practice areas, team pages that are easy to keep current, and WordPress underneath because they will be editing it for years.",
    image: "/images/work-spa.jpg",
  },
  {
    id: "this-portfolio",
    index: "05",
    title: "This Portfolio",
    url: "https://ruwange.lk",
    tags: ["Next.js", "GSAP", "Three.js", "Shaders"],
    description:
      "The site you are reading. Next.js, GSAP and a lot of Three.js: the bent reel at the top, the sketch that draws itself, the ink dissolve between these projects. Made with AI as a second pair of hands, in days, which I say out loud in the About section.",
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
