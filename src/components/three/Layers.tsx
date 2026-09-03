"use client";
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, type RefObject } from "react";

// An exploded diagram of a website, drawn in ink lines on paper: four sheets stacked on
// top of each other — design (the grid), build (the blocks), motion (a path and a dot
// running along it), handover (copy lines, a ticked box, a cursor). They sit flat as the
// section arrives and separate as you scroll, like a drawing being pulled apart to explain it.

const W = 1.5;
const H = 2.0;

function seg(pts: number[], a: [number, number], b: [number, number]) {
  pts.push(a[0], a[1], 0, b[0], b[1], 0);
}
function rect(pts: number[], x: number, y: number, w: number, h: number) {
  seg(pts, [x, y], [x + w, y]);
  seg(pts, [x + w, y], [x + w, y + h]);
  seg(pts, [x + w, y + h], [x, y + h]);
  seg(pts, [x, y + h], [x, y]);
}
function outline(pts: number[]) {
  rect(pts, -W / 2, -H / 2, W, H);
}
function toGeo(pts: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

// Every sheet is traced from something real. Page pixels (a 1400px-wide layout, the first
// 1870px of it) map onto the sheet so the proportions are the sites' own.
const PW = 1400;
const PH = 1870;
const X = (px: number) => -W / 2 + (px / PW) * W;
const Y = (py: number) => H / 2 - (py / PH) * H;
function box(pts: number[], x: number, y: number, w: number, h: number) {
  rect(pts, X(x), Y(y + h), (w / PW) * W, (h / PH) * H);
}

// sheet 1 — design: the layout grid of asaya.lk (three 389px columns on a 1400 canvas,
// the full-bleed hero, the booking bar, the centred section heading)
function designGeo() {
  const p: number[] = [];
  outline(p);
  for (const x of [77, 466, 506, 895, 934, 1323]) seg(p, [X(x), Y(60)], [X(x), Y(PH - 40)]);
  box(p, 0, 0, 1400, 64); // header
  seg(p, [X(0), Y(900)], [X(1400), Y(900)]); // hero bottom edge
  box(p, 86, 904, 1228, 90); // booking bar
  box(p, 336, 980, 727, 146); // section heading, centred
  for (const x of [77, 506, 934]) {
    box(p, x, 1246, 389, 242); // image
    box(p, x, 1488, 389, 291); // copy
  }
  return toGeo(p);
}
// sheet 2 — build: the home page of sudathpereraassociates.com as blocks
// (header, hero copy column, the two-column info band, the practice-areas heading pair)
function buildGeo() {
  const p: number[] = [];
  outline(p);
  box(p, 0, 0, 1400, 88); // header
  box(p, 619, 0, 719, 88); // nav
  box(p, 62, 150, 640, 360); // hero headline
  box(p, 62, 551, 640, 134); // hero paragraph
  seg(p, [X(0), Y(935)], [X(1400), Y(935)]); // hero ends
  box(p, 62, 997, 599, 599); // info: image column
  box(p, 739, 997, 599, 463); // info: sticky copy
  seg(p, [X(0), Y(1658)], [X(1400), Y(1658)]);
  box(p, 62, 1720, 599, 225); // practice-areas heading
  box(p, 739, 1720, 599, 225); // practice-areas intro
  return toGeo(p);
}
// sheet 3 — motion: the bend the hero reel rides. This is the sheet function from
// HeroGallery's shader, sin(pi q) * exp(-q^2) over q in [-1.2, 0.8], drawn to scale.
const Q0 = -1.2;
const Q1 = 0.8;
function reelBend(q: number) {
  return Math.sin(Math.PI * q) * Math.exp(-q * q);
}
function motionCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    const q = Q0 + (Q1 - Q0) * t;
    pts.push(new THREE.Vector3(-W / 2 + 0.15 + t * (W - 0.3), reelBend(q) * 0.55, 0));
  }
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0);
}
function motionGeo() {
  const p: number[] = [];
  outline(p);
  // the rest position, and the velocity response tanh(v / 550) in the corner
  seg(p, [-W / 2 + 0.15, 0], [W / 2 - 0.15, 0]);
  const cx = -W / 2 + 0.16, cy = -H / 2 + 0.18, cw = 0.5, ch = 0.32;
  seg(p, [cx, cy], [cx + cw, cy]);
  seg(p, [cx, cy], [cx, cy + ch]);
  let prev: [number, number] | null = null;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const pt: [number, number] = [cx + t * cw, cy + Math.tanh(t * 3) * ch];
    if (prev) seg(p, prev, pt);
    prev = pt;
  }
  // timeline ticks
  for (let i = 0; i <= 8; i++) {
    const x = -W / 2 + 0.15 + (i / 8) * (W - 0.3);
    seg(p, [x, -0.03], [x, i % 4 === 0 ? 0.05 : 0.02]);
  }
  return toGeo(p);
}
// sheet 4 — handover: the WordPress block editor a client is left with
// (toolbar, title, paragraph and image blocks, the settings sidebar, the Update button)
function handoverGeo() {
  const p: number[] = [];
  outline(p);
  box(p, 0, 0, 1400, 60); // toolbar
  box(p, 16, 14, 32, 32); // "+" block inserter
  seg(p, [X(32), Y(20)], [X(32), Y(40)]);
  seg(p, [X(22), Y(30)], [X(42), Y(30)]);
  box(p, 1230, 12, 150, 36); // Update button
  seg(p, [X(0), Y(60)], [X(1400), Y(60)]);
  seg(p, [X(1000), Y(60)], [X(1000), Y(PH)]); // sidebar edge
  // canvas: title + blocks
  box(p, 180, 140, 640, 90); // post title
  for (let i = 0; i < 4; i++) seg(p, [X(180), Y(300 + i * 60)], [X(180 + [640, 560, 610, 380][i]), Y(300 + i * 60)]);
  box(p, 180, 560, 640, 400); // image block
  seg(p, [X(180), Y(560)], [X(820), Y(960)]);
  seg(p, [X(820), Y(560)], [X(180), Y(960)]);
  for (let i = 0; i < 3; i++) seg(p, [X(180), Y(1040 + i * 60)], [X(180 + [600, 640, 300][i]), Y(1040 + i * 60)]);
  // sidebar panels
  for (let i = 0; i < 5; i++) {
    const y = 90 + i * 300;
    box(p, 1030, y, 340, 260);
    seg(p, [X(1050), Y(y + 40)], [X(1230), Y(y + 40)]);
    seg(p, [X(1050), Y(y + 110)], [X(1330), Y(y + 110)]);
    seg(p, [X(1050), Y(y + 160)], [X(1290), Y(y + 160)]);
  }
  return toGeo(p);
}

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: new THREE.Color(cs.getPropertyValue("--ink").trim() || "#17170f"),
    accent: new THREE.Color(cs.getPropertyValue("--accent").trim() || "#e8451f"),
    paper: new THREE.Color(cs.getPropertyValue("--paper").trim() || "#f3f1ea"),
  };
}

export type LayersState = { p: number };
/** DOM labels, in layer order (design, build, motion, handover); pinned to each sheet's edge each frame. */
export type LayerLabels = RefObject<(HTMLElement | null)[]>;

function Scene({ stateRef, labels }: { stateRef: RefObject<LayersState>; labels?: LayerLabels }) {
  const { camera } = useThree();
  const probe = useMemo(() => new THREE.Vector3(), []);
  const group = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const layers = useRef<(THREE.Object3D | null)[]>([]);
  const inkMats = useRef<THREE.LineBasicMaterial[]>([]);
  const tokens = useRef({ ink: new THREE.Color("#17170f"), accent: new THREE.Color("#e8451f"), paper: new THREE.Color("#f3f1ea") });
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const geos = useMemo(() => [designGeo(), buildGeo(), motionGeo(), handoverGeo()], []);
  const curve = useMemo(() => motionCurve(), []);
  const curveGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)), [curve]);
  const mats = useMemo(
    () => [0.9, 0.8, 0.7, 0.85].map((o) => new THREE.LineBasicMaterial({ color: "#17170f", transparent: true, opacity: o })),
    [],
  );
  const curveMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#e8451f", transparent: true, opacity: 0.9 }), []);
  // paper fills for the lower three sheets, so each one hides what's beneath it; the top sheet stays open
  const fillMats = useMemo(() => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: "#f3f1ea", transparent: true, opacity: 1 })), []);
  const fillGeo = useMemo(() => new THREE.PlaneGeometry(W, H), []);

  useEffect(() => {
    inkMats.current = mats;
    tokens.current = readTokens();
    const mo = new MutationObserver(() => {
      tokens.current = readTokens();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      geos.forEach((g) => g.dispose());
      curveGeo.dispose();
      mats.forEach((m) => m.dispose());
      fillMats.forEach((m) => m.dispose());
      fillGeo.dispose();
      curveMat.dispose();
    };
  }, [geos, curveGeo, mats, curveMat, fillMats, fillGeo]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    const p = THREE.MathUtils.clamp(stateRef.current?.p ?? 0, 0, 1);
    const pt = pointer.current;
    pt.x += (pt.tx - pt.x) * Math.min(1, dt * 4);
    pt.y += (pt.ty - pt.y) * Math.min(1, dt * 4);

    // colours follow the page tokens
    const k = Math.min(1, dt * 2.2);
    mats.forEach((m) => m.color.lerp(tokens.current.ink, k));
    fillMats.forEach((m) => m.color.lerp(tokens.current.paper, k));
    curveMat.color.lerp(tokens.current.accent, k);

    if (group.current) {
      group.current.rotation.x = -1.05 + pt.y * 0.08 + Math.sin(t * 0.4) * 0.02;
      group.current.rotation.z = 0.5 + pt.x * 0.1;
      group.current.position.y = -0.55 + Math.sin(t * 0.6) * 0.03;
      // on wide canvases the legend sits to the right, so shift the stack left of it;
      // on phones the legend moves below the drawing and the stack can stay centred
      group.current.position.x = window.innerWidth > 900 ? -0.55 : 0;
    }
    // the sheets separate as the section scrolls, each a beat after the last
    const spread = THREE.MathUtils.smoothstep(p, 0.05, 0.75);
    layers.current.forEach((l, i) => {
      if (!l) return;
      const own = THREE.MathUtils.clamp((spread - i * 0.12) / 0.64, 0, 1);
      l.position.z = i * 0.62 * own;
      const fade = THREE.MathUtils.clamp((p - i * 0.1) / 0.3, 0, 1);
      mats[i].opacity = [0.9, 0.8, 0.7, 0.85][i] * fade;
      if (fillMats[i]) fillMats[i].opacity = fade;
    });
    curveMat.opacity = 0.9 * THREE.MathUtils.clamp((p - 0.35) / 0.3, 0, 1);
    // pin each label to the vertical centre of its sheet's right-hand edge
    const wide = typeof window !== "undefined" && window.innerWidth > 900; // matches the CSS breakpoint
    if (labels?.current && wide) {
      layers.current.forEach((l, i) => {
        const el = labels.current?.[i];
        if (!l || !el) return;
        probe.set(W / 2, 0, 0);
        l.localToWorld(probe).project(camera);
        el.style.top = `${((1 - probe.y) / 2) * 100}%`;
        // each label appears only once its sheet has lifted clear of the one below,
        // so they never pile up while the stack is still closed
        const own = THREE.MathUtils.clamp((spread - i * 0.12) / 0.64, 0, 1);
        const show = i === 0 ? THREE.MathUtils.smoothstep(spread, 0.05, 0.3) : THREE.MathUtils.smoothstep(own, 0.7, 0.95);
        el.style.opacity = String(show);
        el.style.transform = `translate(${(1 - show) * 10}px, -50%)`;
      });
    }
    // the motion dot runs the easing curve, back and forth
    if (dot.current) {
      const u = 0.5 + 0.5 * Math.sin(t * 0.7);
      const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const pos = curve.getPoint(eased);
      dot.current.position.set(pos.x, pos.y, 0.02);
      dot.current.visible = curveMat.opacity > 0.05;
    }
  });

  return (
    <group ref={group} scale={1.05}>
      {geos.map((g, i) => (
        <group
          key={i}
          ref={(el) => {
            layers.current[i] = el;
          }}
        >
          {i < 3 && <mesh geometry={fillGeo} material={fillMats[i]} position={[0, 0, -0.004]} />}
          <lineSegments geometry={g} material={mats[i]} />
          {i === 2 && (
            <>
              <primitive object={new THREE.Line(curveGeo, curveMat)} />
              <mesh ref={dot}>
                <sphereGeometry args={[0.035, 12, 12]} />
                <meshBasicMaterial color="#e8451f" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

export default function Layers({ stateRef, labels }: { stateRef: RefObject<LayersState>; labels?: LayerLabels }) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, 0, 7.2], near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene stateRef={stateRef} labels={labels} />
    </Canvas>
  );
}
