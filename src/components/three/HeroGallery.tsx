"use client";
/* eslint-disable react-hooks/immutability, react-hooks/refs */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { projects, reel } from "@/data/site";
import { withLenis, scrollToHash } from "@/lib/lenis";
import { onReady } from "@/lib/ready";
import { gsap } from "@/lib/gsap";

// The cards lie on a bent "sheet": an S-shaped sweep in depth with a gaussian tail,
// a hinge lean across the frame, a slight bank (roll) that follows the sweep's slope,
// and a velocity response — the strip rears up on the left and twists at the edges
// while it moves. Hover is a pose, not a recolour: the card's middle bows away (a dome
// that is exactly zero along every edge) and the surface is lit with an analytic normal
// so a sheen rolls over it. Same closed form in both stages, so shading never chords.
const SHEET_GLSL = /* glsl */ `
  const float PI = 3.141592653589793;
  const float BANK = -0.16;
  const float DIAG = 0.03;
  const float REAR_Y = 0.06;
  const float REAR_Z = 0.2;
  const float VTWIST = 1.8;
  const float TAIL = 1.0;
  const float SHIFT = -0.2;

  uniform float uSheetW; // frustum half-width at z = 0
  uniform float uSheetD; // sweep amplitude, world units
  uniform float uSheetT; // how much of the frame the S spans
  uniform float uSheetC; // 0 = symmetric bowl, 1 = near-to-far S
  uniform float uSheetV; // smoothed scroll speed 0..1
  uniform float uLeanA;  // hinge depth at the frame edge
  uniform float uLeanW;  // frustum half-width for the hinge
  uniform float uHover;  // 0 at rest, 1 with the pointer on the card
  uniform float uDent;   // how far the middle bows back, share of height
  uniform vec2 uPlaneRes; // plane world size

  float sheetQ(float wx) { return wx / max(uSheetW, 0.0001) * uSheetT + SHIFT; }
  float sheetShape(float q) { return mix(1.0 - q * q, sin(PI * q), uSheetC) * exp(-TAIL * q * q); }
  float sheetShapeSlope(float q) {
    float g = exp(-TAIL * q * q);
    float bowl = -2.0 * q * (1.0 + TAIL * (1.0 - q * q));
    float ess = PI * cos(PI * q) - 2.0 * TAIL * q * sin(PI * q);
    return mix(bowl, ess, uSheetC) * g;
  }
  float sheetZ(float wx) { return -uSheetD * sheetShape(sheetQ(wx)); }
  float sheetRoll(float wx) { return BANK * sheetShapeSlope(sheetQ(wx)) / PI * uSheetC; }
  float leanRamp(float s) { s = clamp(s, -1.0, 1.0); return s * (1.5 - 0.5 * s * s); }
  float leanSlope(float s) { s = min(abs(s), 1.0); return 1.5 * (1.0 - s * s); }
  float dome(vec2 uv) { vec2 q = uv * 2.0 - 1.0; return (1.0 - q.x * q.x) * (1.0 - q.y * q.y); }
`;

const VERT = /* glsl */ `
  uniform float uIntro;
  varying vec2 vUv;
  varying vec3 vFlat;
  ${SHEET_GLSL}
  void main() {
    vUv = uv;
    vFlat = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 p = position;
    p.z -= uHover * uDent * uPlaneRes.y * dome(uv);
    vec4 w = modelMatrix * vec4(p, 1.0);

    // wind: bank with the sweep, plus the velocity twist toward the edges
    float qe = w.x / max(uSheetW, 0.0001);
    float a = sheetRoll(w.x) + VTWIST * uSheetV * smoothstep(0.3, 0.9, abs(qe)) * sign(qe);
    float s = sin(a), c = cos(a);
    w = vec4(w.x, w.y * c - w.z * s, w.y * s + w.z * c, w.w);

    // the sweep, the diagonal, and the rear-up on the left when moving
    w.z += sheetZ(w.x);
    w.y += DIAG * w.x;
    float m = 1.0 - smoothstep(-1.0, 0.3, qe);
    w.y += REAR_Y * uSheetW * uSheetV * m;
    w.z += REAR_Z * uSheetW * uSheetV * m;

    // the hinge the whole strip hangs off
    w.z += uLeanA * leanRamp(w.x / max(uLeanW, 0.0001));

    // intro: rise from below
    w.y -= (1.0 - uIntro) * 1.2;

    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uImgRes;
  uniform float uIntro;
  uniform float uShade;
  uniform float uCorner;
  uniform float uBorder;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  varying vec2 vUv;
  varying vec3 vFlat;
  ${SHEET_GLSL}

  const vec3 LIGHT_DIR = normalize(vec3(-0.4, 0.5, 1.0));
  const float LIGHT_GLOSS = 48.0;
  const float LIGHT_SPEC = 0.28;
  const float LIGHT_DIFF = 0.12;

  vec2 cover(vec2 uv, vec2 img, vec2 plane) {
    float ia = img.x / img.y, pa = plane.x / plane.y;
    vec2 s = ia > pa ? vec2(pa / ia, 1.0) : vec2(1.0, ia / pa);
    vec2 o = ia > pa ? vec2((1.0 - s.x) * 0.5, 0.0) : vec2(0.0, 1.0 - s.y);
    return uv * s + o;
  }
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p - b) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  // 0 on the near crests, 1 in the far troughs; the dent counts toward it
  float sheetShade(float wx, vec2 uv) {
    float d = uSheetD > 0.001 ? clamp((uSheetD - sheetZ(wx)) / (2.0 * uSheetD), 0.0, 1.0) : 0.0;
    d += (uHover * uDent * uPlaneRes.y * dome(uv)) / max(2.0 * uSheetD, 0.0001);
    return clamp(d, 0.0, 1.0);
  }
  float sheetOffset(float wx, vec2 uv) {
    return sheetZ(wx) + uLeanA * leanRamp(wx / max(uLeanW, 0.0001)) - uHover * uDent * uPlaneRes.y * dome(uv);
  }
  vec3 sheetNormal(float wx, vec2 uv) {
    float dzdx = -uSheetD * sheetShapeSlope(sheetQ(wx)) * uSheetT / max(uSheetW, 0.0001);
    dzdx += (uLeanA / max(uLeanW, 0.0001)) * leanSlope(wx / max(uLeanW, 0.0001));
    float dzdy = 0.0;
    if (uHover > 0.0001) {
      vec2 q = uv * 2.0 - 1.0;
      float a = uHover * uDent;
      dzdx += 4.0 * a * uPlaneRes.y * q.x * (1.0 - q.y * q.y) / max(uPlaneRes.x, 0.0001);
      dzdy += 4.0 * a * q.y * (1.0 - q.x * q.x);
    }
    vec3 n = normalize(vec3(-dzdx, -dzdy, 1.0));
    float a = sheetRoll(wx);
    float s = sin(a), c = cos(a);
    return vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
  }
  vec3 lit(vec3 col, vec3 n, vec3 v, float amt) {
    float d = dot(n, LIGHT_DIR) * 0.5 + 0.5;
    col *= 1.0 - LIGHT_DIFF * amt * (1.0 - d);
    vec3 h = normalize(LIGHT_DIR + v);
    return col + pow(max(dot(n, h), 0.0), LIGHT_GLOSS) * LIGHT_SPEC * amt;
  }

  void main() {
    vec3 col = texture2D(uTex, cover(vUv, uImgRes, uPlaneRes)).rgb;

    // atmospheric depth: the far parts of the sheet sink toward the page
    float depth = sheetShade(vFlat.x, vUv);
    col = mix(col, uPaper, uShade * 0.55 * depth);

    // light on the surface, from the exact point the vertex stage left it at
    vec3 p = vFlat + vec3(0.0, 0.0, sheetOffset(vFlat.x, vUv));
    col = lit(col, sheetNormal(vFlat.x, vUv), normalize(cameraPosition - p), uShade);

    // rounded corners + hairline, cut in the plane's own height units
    vec2 sz = vec2(uPlaneRes.x / max(uPlaneRes.y, 0.0001), 1.0);
    vec2 mid = sz * 0.5;
    float r = min(uCorner, min(mid.x, mid.y));
    float d = roundedBox(vUv * sz, mid, r);
    float aa = max(fwidth(d), 0.0001);
    float alpha = uIntro * (1.0 - smoothstep(-aa, aa, d));
    col = mix(col, uInk, 0.35 * smoothstep(-uBorder - aa, -uBorder + aa, d));

    gl_FragColor = vec4(col, alpha);
  }
`;

function Strip() {
  const { viewport, size, gl } = useThree();
  const textures = useTexture(reel.map((p) => p.image));
  const n = reel.length;
  const count = n * 2;

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  const isMobile = size.width < 760;
  const isTablet = size.width < 1024;
  // Size cards from the canvas HEIGHT on desktop so the sheet's lean, bank and rear-up
  // never push a card past the top or bottom edge on wide screens.
  const hMax = viewport.height * 0.5;
  const w = isMobile
    ? viewport.width * 0.62
    : Math.min(viewport.width * (isTablet ? 0.42 : 0.32), hMax / 0.78);
  const h = w * 0.78;
  const gap = w * 0.028;
  const step = w + gap;
  const total = step * count;

  const st = useRef({
    offset: 0,
    target: 0,
    prev: 0,
    vel: 0,
    sv: 0,
    dragging: false,
    lastX: 0,
    moved: 0,
    hover: -1,
    intro: 0,
  }).current;

  const mats = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = textures[i % n];
        const img = t.image as { width: number; height: number };
        return new THREE.ShaderMaterial({
          uniforms: {
            uTex: { value: t },
            uImgRes: { value: new THREE.Vector2(img.width, img.height) },
            uPlaneRes: { value: new THREE.Vector2(1, 1) },
            uIntro: { value: 0 },
            uHover: { value: 0 },
            uDent: { value: 0.1 },
            uShade: { value: 1 },
            uCorner: { value: 0.025 },
            uBorder: { value: 0.004 },
            uPaper: { value: new THREE.Color("#f3f1ea") },
            uInk: { value: new THREE.Color("#17170f") },
            uSheetW: { value: 1 },
            uSheetD: { value: 0 },
            uSheetT: { value: 1.0 },
            uSheetC: { value: 1.0 },
            uSheetV: { value: 0 },
            uLeanA: { value: 0 },
            uLeanW: { value: 1 },
          },
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
        });
      }),
    [textures, count, n],
  );

  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    const off = onReady(() => {
      gsap.to(st, { intro: 1, duration: 1.8, ease: "power3.out", delay: 0.35 });
    });
    return off;
  }, [st]);

  useEffect(() => {
    const el = gl.domElement;
    const toWorld = (px: number) => (px / size.width) * viewport.width;
    const down = (e: PointerEvent) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.moved = 0;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!st.dragging) return;
      const dx = toWorld(e.clientX - st.lastX);
      st.lastX = e.clientX;
      st.target += dx * 1.15;
      st.moved += Math.abs(dx);
    };
    const up = () => {
      st.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    let detach: (() => void) | undefined;
    withLenis((l) => {
      const onScroll = ({ velocity }: { velocity: number }) => {
        st.target -= velocity * 0.0035 * (viewport.width / 10);
      };
      l.on("scroll", onScroll);
      detach = () => l.off("scroll", onScroll);
    });

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      detach?.();
    };
  }, [gl, size.width, viewport.width, st]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    if (!st.dragging) st.target -= 0.18 * d * (viewport.width / 10);
    st.offset += (st.target - st.offset) * Math.min(1, d * 7);
    const inst = (st.offset - st.prev) / Math.max(dt, 1 / 120);
    st.prev = st.offset;
    st.vel += (inst - st.vel) * Math.min(1, d * 10);

    // the sheet's velocity response: tanh of the strip's speed in px/s, smoothed
    const pxPerSec = Math.abs(st.vel) * (size.width / viewport.width);
    const svTarget = Math.tanh(pxPerSec / (isMobile ? 245 : 550));
    st.sv += (svTarget - st.sv) * Math.min(1, d * 5);

    const halfW = viewport.width / 2;
    const sheetD = viewport.width * 0.05;
    const leanA = -viewport.width * 0.09;

    for (let i = 0; i < count; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const x = THREE.MathUtils.euclideanModulo(i * step + st.offset + total / 2, total) - total / 2;
      m.position.x = x;
      const u = mats[i].uniforms;
      u.uIntro.value = st.intro;
      u.uPlaneRes.value.set(w, h);
      u.uSheetW.value = halfW;
      u.uSheetD.value = sheetD;
      u.uLeanA.value = leanA;
      u.uLeanW.value = halfW;
      u.uSheetV.value = st.sv;
      const hv = st.hover === i ? 1 : 0;
      u.uHover.value += (hv - u.uHover.value) * Math.min(1, d * 6);
    }
  });

  return (
    <group>
      {mats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          material={m}
          // the sheet displaces vertices in the shader, so the flat bounding box lies:
          // never let three cull a card that is still visible after the bend
          frustumCulled={false}
          onPointerOver={() => {
            st.hover = i;
          }}
          onPointerOut={() => {
            if (st.hover === i) st.hover = -1;
          }}
          onClick={() => {
            if (st.moved >= 0.03) return;
            const item = reel[i % n];
            // selected work scrolls to its plate; reel-only sites open in a new tab
            if (projects.some((p) => p.id === item.id)) scrollToHash(`#work-${item.id}`);
            else if (item.url) window.open(item.url, "_blank", "noopener");
          }}
        >
          <planeGeometry args={[w, h, 32, 32]} />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroGallery() {
  return (
    <Canvas
      flat
      dpr={[1, 1.8]}
      camera={{ fov: 38, position: [0, 0, 6], near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", left: 0, right: 0, top: "-14%", bottom: "-30%" }}
    >
      <Suspense fallback={null}>
        <Strip />
      </Suspense>
    </Canvas>
  );
}
