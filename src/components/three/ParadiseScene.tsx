"use client";
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, type RefObject } from "react";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The pencil drawing of the veranda sketches itself in (three passes, driven by uReveal),
// but now it sits over a living wash: a warm sky, a sun that sinks toward the horizon as you
// scroll past (uSun), and water that glints under it. Everything colour lives in the drawing's
// own image space, inside its drawn border, so the paper around it stays paper.
const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uImgRes;
  uniform vec2 uPlaneRes;
  uniform float uReveal;
  uniform float uSun;
  uniform float uTime;
  uniform float uPar;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  varying vec2 vUv;

  const float HORIZON = 0.57;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }
  vec2 cover(vec2 uv, vec2 img, vec2 plane) {
    float ia = img.x / img.y, pa = plane.x / plane.y;
    vec2 s = ia > pa ? vec2(pa / ia, 1.0) : vec2(1.0, ia / pa);
    // zoom in a touch so the drawing's own pencil border stays outside the panel
    return (uv - 0.5) * s * 0.93 + 0.5;
  }
  float front(float p, float key, float w) { return smoothstep(key - w, key + w, p); }

  void main() {
    vec2 uv = cover(vUv, uImgRes, uPlaneRes) + vec2(0.0, (uPar - 0.5) * 0.03);
    const vec3 W = vec3(0.299, 0.587, 0.114);
    vec3 tex = texture2D(uTex, uv).rgb;
    float lum = dot(tex, W);
    float dark = clamp((1.0 - lum - 0.07) / 0.93, 0.0, 1.0);
    dark = pow(dark, 0.95);
    float blur = clamp((1.0 - dot(texture2D(uTex, uv, 4.5).rgb, W) - 0.07) / 0.93, 0.0, 1.0);
    float edge = clamp((dark - blur * 0.85) * 1.7, 0.0, 1.0);

    // ---- the wash, inside the drawing's border ----
    float inside = 1.0;
    float aspect = uImgRes.x / uImgRes.y;

    // sun: sits above the horizon at rest, sinks into the sea as the section scrolls by
    vec2 sunPos = vec2(0.66, HORIZON + 0.02 + 0.2 * (1.0 - uSun));
    float sd = length(vec2((uv.x - sunPos.x) * aspect, uv.y - sunPos.y));
    float disc = 1.0 - smoothstep(0.03, 0.036, sd);
    float glow = exp(-sd * sd * 60.0);
    float haze = exp(-sd * sd * 6.0);

    vec3 apricot = vec3(0.96, 0.80, 0.62);
    vec3 rose = vec3(0.93, 0.62, 0.45);
    vec3 sunCol = vec3(0.93, 0.36, 0.20);

    // sky: paper at the top, warming toward the horizon, warmer still as the sun drops
    float skyT = smoothstep(1.0, HORIZON, uv.y);
    vec3 sky = mix(uPaper, apricot, skyT * 0.85);
    sky = mix(sky, rose, skyT * skyT * 0.5 * (0.4 + 0.6 * uSun));
    sky += sunCol * (glow * 0.55 + haze * 0.18);
    sky = mix(sky, vec3(0.99, 0.93, 0.80), disc);

    // sea: pale teal, a warm reflection column under the sun, and moving glints
    float seaT = smoothstep(HORIZON, 0.30, uv.y);
    vec3 sea = mix(vec3(0.84, 0.88, 0.86), vec3(0.62, 0.75, 0.73), seaT);
    float column = exp(-pow((uv.x - sunPos.x) * aspect * 3.2, 2.0)) * smoothstep(HORIZON, HORIZON - 0.22, uv.y) * smoothstep(0.28, 0.40, uv.y);
    float ripple = noise(vec2(uv.x * 90.0, uv.y * 260.0 - uTime * 1.6)) * noise(vec2(uv.x * 40.0 + uTime * 0.3, uv.y * 120.0));
    float glint = smoothstep(0.42, 0.6, ripple) * column;
    sea = mix(sea, rose, column * 0.45);
    sea += sunCol * glint * 0.9 * (0.5 + 0.5 * uSun);
    // near the horizon the sea takes the sky's colour
    sea = mix(sea, sky, smoothstep(HORIZON - 0.02, HORIZON, uv.y) * 0.6);

    float isSky = smoothstep(HORIZON - 0.004, HORIZON + 0.004, uv.y);
    vec3 wash = mix(sea, sky, isSky);
    // the wash fades out below the sea into the veranda floor
    float washAmt = inside * smoothstep(0.22, 0.34, uv.y);
    vec3 under = mix(uPaper, wash, washAmt * uReveal);

    // ---- the pencil, sketched in over the wash ----
    float nA = fbm(vUv * 9.0);
    float nB = fbm(vUv * 14.0 + 7.3);
    float grain = noise(vUv * uPlaneRes * 0.9);
    float hatch = 0.5 + 0.5 * sin((vUv.x - vUv.y) * 260.0 + nB * 6.0);
    float pA = uReveal / 0.5;
    float keyA = (vUv.x * 0.62 + (1.0 - vUv.y) * 0.38) + (nA - 0.5) * 0.28;
    float fA = front(pA, keyA, 0.05);
    float contour = smoothstep(0.22, 0.6, edge) * smoothstep(0.3, 0.65, dark);
    float rLines = fA * contour;
    float rGhost = fA * 0.16;
    float pB = (uReveal - 0.32) / 0.55;
    float keyB = (vUv.x * 0.35 + vUv.y * 0.65) + (nB - 0.5) * 0.3 + hatch * 0.07;
    float rTone = front(pB, keyB, 0.06);
    float rFinal = smoothstep(0.0, 1.0, clamp((uReveal - 0.84) / 0.16, 0.0, 1.0));
    float r = max(max(rLines, rGhost), max(rTone, rFinal));
    r *= 0.82 + 0.18 * grain;
    float deep = smoothstep(0.7, 0.95, dark) * (1.0 - rFinal) * 0.25;
    float alpha = clamp(dark * r - deep, 0.0, 1.0);

    // pencil over sky/sea is slightly softer than over paper, like graphite over a wash
    vec3 col = mix(under, uInk, alpha * (1.0 - 0.15 * washAmt));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type ParadiseState = { reveal: number; sun: number; par: number };
type Props = { src: string; stateRef: RefObject<ParadiseState> };

function Plane({ src, stateRef }: Props) {
  const { viewport, size } = useThree();
  const tex = useTexture(src);

  useEffect(() => {
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
  }, [tex]);

  const mat = useMemo(() => {
    const img = tex.image as { width: number; height: number };
    return new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uImgRes: { value: new THREE.Vector2(img.width, img.height) },
        uPlaneRes: { value: new THREE.Vector2(1, 1) },
        uReveal: { value: 0 },
        uSun: { value: 0 },
        uTime: { value: 0 },
        uPar: { value: 0.5 },
        uInk: { value: new THREE.Color("#17170f") },
        uPaper: { value: new THREE.Color("#f3f1ea") },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
  }, [tex]);

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame(({ clock }, dt) => {
    const u = mat.uniforms;
    const s = stateRef.current;
    u.uPlaneRes.value.set(size.width, size.height);
    u.uTime.value = clock.getElapsedTime();
    if (s) {
      u.uReveal.value = s.reveal;
      u.uSun.value += (s.sun - u.uSun.value) * Math.min(1, dt * 6);
      u.uPar.value += (s.par - u.uPar.value) * Math.min(1, dt * 6);
    }
  });

  return (
    <mesh material={mat}>
      <planeGeometry args={[viewport.width, viewport.height]} />
    </mesh>
  );
}

export default function ParadiseScene(props: Props) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1, near: 0.1, far: 20 }}
      gl={{ alpha: false, antialias: false }}
      onCreated={({ gl }) => gl.setClearColor(0xf3f1ea, 1)}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Plane {...props} />
      </Suspense>
    </Canvas>
  );
}
