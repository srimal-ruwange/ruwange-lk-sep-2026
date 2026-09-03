"use client";
/* eslint-disable react-hooks/immutability, react-hooks/refs */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { projects } from "@/data/site";
import { withLenis } from "@/lib/lenis";

// Share of each project's scroll segment spent dissolving into the next one.
export const SWAP_START = 0.78;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Two plates, A dissolving into B through an ink wash: a noisy diagonal front sweeps across,
// the leading edge bleeds ink into the paper, and a dry-brush grain breaks the boundary up.
// The pointer bulges the print like a loupe; scroll adds a slow vertical drift.
const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2 uResA;
  uniform vec2 uResB;
  uniform vec2 uPlaneRes;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uMix;
  uniform float uDriftA;
  uniform float uDriftB;
  uniform vec3 uInk;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }
  vec2 cover(vec2 uv, vec2 img, vec2 plane, float zoom) {
    float ia = img.x / img.y, pa = plane.x / plane.y;
    vec2 s = ia > pa ? vec2(pa / ia, 1.0) : vec2(1.0, ia / pa);
    s /= zoom;
    vec2 o = ia > pa ? vec2((1.0 - s.x) * 0.5, (1.0 - s.y) * 0.5) : vec2((1.0 - s.x) * 0.5, 1.0 - s.y);
    return uv * s + o;
  }

  void main() {
    vec2 uv = vUv;

    // loupe: pull samples toward the pointer so the print bulges under it
    vec2 d = uv - uMouse;
    float r = length(d * vec2(uPlaneRes.x / uPlaneRes.y, 1.0));
    float l = smoothstep(0.42, 0.0, r) * uHover;
    uv -= d * l * 0.22;

    // slow drift as the section scrolls, so a plate never sits perfectly still.
    // Each plate drifts on its OWN clock (B is one segment behind A), so when B becomes A
    // at the end of a dissolve its offset carries straight over — no jump.
    vec3 a = texture2D(uTexA, cover(uv, uResA, uPlaneRes, 1.08) + vec2(0.0, uDriftA * 0.06)).rgb;
    vec3 b = texture2D(uTexB, cover(uv, uResB, uPlaneRes, 1.08) + vec2(0.0, uDriftB * 0.06)).rgb;

    // the ink front
    float n = fbm(vUv * 4.5 + vec2(0.0, uMix * 0.4));
    float fine = noise(vUv * 90.0) - 0.5;
    float wipe = vUv.x * 0.5 + (1.0 - vUv.y) * 0.2 + n * 0.55 + fine * 0.05;
    float k = mix(-0.25, 1.35, uMix);
    float edge = wipe - k;
    float rB = 1.0 - smoothstep(0.0, 0.12, edge);
    float on = step(0.001, uMix) * step(uMix, 0.999);
    float bleed = (1.0 - smoothstep(0.0, 0.11, abs(edge))) * on;
    float wet = (1.0 - smoothstep(0.0, 0.035, abs(edge))) * on;

    vec3 col = mix(a, b, rB);
    // a thin wet ink line with a soft, grainy halo — enough to read as a wash, not a blot
    col = mix(col, uInk, bleed * bleed * 0.32 + wet * 0.3);
    col += (fine * 0.5) * bleed;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = { progressRef: RefObject<{ p: number }> };

function Plate({ progressRef }: Props) {
  const { viewport, size, gl } = useThree();
  const textures = useTexture(projects.map((p) => p.image));
  const n = projects.length;

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      t.needsUpdate = true;
    });
  }, [textures, gl]);

  const st = useRef({ mouse: new THREE.Vector2(0.5, 0.5), tm: new THREE.Vector2(0.5, 0.5), hover: 0, th: 0, vel: 0, tilt: 0, p: 0 }).current;

  const mat = useMemo(() => {
    const res = (t: THREE.Texture) => {
      const img = t.image as { width: number; height: number };
      return new THREE.Vector2(img.width, img.height);
    };
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexA: { value: textures[0] },
        uTexB: { value: textures[1 % n] },
        uResA: { value: res(textures[0]) },
        uResB: { value: res(textures[1 % n]) },
        uPlaneRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uMix: { value: 0 },
        uDriftA: { value: 0 },
        uDriftB: { value: 0 },
        uInk: { value: new THREE.Color("#17170f") },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
  }, [textures, n]);

  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      st.tm.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    const enter = () => (st.th = 1);
    const leave = () => (st.th = 0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    let detach: (() => void) | undefined;
    withLenis((l) => {
      const onScroll = ({ velocity }: { velocity: number }) => {
        st.vel = velocity;
      };
      l.on("scroll", onScroll);
      detach = () => l.off("scroll", onScroll);
    });
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      detach?.();
    };
  }, [gl, st]);

  const mesh = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    // ease toward the scroll position so wheel steps don't stutter the dissolve
    const target = THREE.MathUtils.clamp(progressRef.current?.p ?? 0, 0, 0.9999);
    st.p += (target - st.p) * Math.min(1, d * 7);
    const p = st.p;
    const seg = p * n;
    const i = Math.min(n - 1, Math.floor(seg));
    const local = seg - i;
    const next = Math.min(n - 1, i + 1);
    const mix = i === n - 1 ? 0 : THREE.MathUtils.smoothstep(local, SWAP_START, 1);

    const u = mat.uniforms;
    if (u.uTexA.value !== textures[i]) {
      u.uTexA.value = textures[i];
      (u.uResA.value as THREE.Vector2).set((textures[i].image as HTMLImageElement).width, (textures[i].image as HTMLImageElement).height);
    }
    if (u.uTexB.value !== textures[next]) {
      u.uTexB.value = textures[next];
      (u.uResB.value as THREE.Vector2).set((textures[next].image as HTMLImageElement).width, (textures[next].image as HTMLImageElement).height);
    }
    u.uMix.value = mix;
    u.uDriftA.value = local - 0.5;
    u.uDriftB.value = local - 1.5;
    u.uPlaneRes.value.set(size.width, size.height);

    st.mouse.lerp(st.tm, Math.min(1, d * 8));
    st.hover += (st.th - st.hover) * Math.min(1, d * 6);
    (u.uMouse.value as THREE.Vector2).copy(st.mouse);
    u.uHover.value = st.hover;

    // the plate tilts with scroll speed and leans toward the pointer
    const tiltTarget = THREE.MathUtils.clamp(st.vel * 0.0025, -0.18, 0.18);
    st.tilt += (tiltTarget - st.tilt) * Math.min(1, d * 5);
    st.vel *= Math.pow(0.001, d); // decay if Lenis goes quiet
    if (mesh.current) {
      mesh.current.rotation.x = st.tilt + (st.mouse.y - 0.5) * -0.06 * st.hover;
      mesh.current.rotation.y = (st.mouse.x - 0.5) * 0.08 * st.hover;
    }
  });

  return (
    <mesh ref={mesh} material={mat} frustumCulled={false}>
      <planeGeometry args={[viewport.width, viewport.height]} />
    </mesh>
  );
}

export default function WorkViewer(props: Props) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 30, position: [0, 0, 4], near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Plate {...props} />
      </Suspense>
    </Canvas>
  );
}
