"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { cities, site } from "@/data/site";

const INK = "#17170f";
const PAPER = "#f3f1ea";
const ACCENT = "#e8451f";
const R = 1;
const D2R = Math.PI / 180;

function latLon(lat: number, lon: number, r = R) {
  const phi = (90 - lat) * D2R;
  const theta = (lon + 180) * D2R;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function gridGeometry() {
  const pts: number[] = [];
  const seg = 96;
  const push = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let i = 0; i < seg; i++) {
      push(latLon(lat, (i / seg) * 360 - 180), latLon(lat, ((i + 1) / seg) * 360 - 180));
    }
  }
  for (let lon = -180; lon < 180; lon += 15) {
    for (let i = 0; i < seg; i++) {
      push(latLon((i / seg) * 360 - 90, lon), latLon(((i + 1) / seg) * 360 - 90, lon));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function arcPoints(a: THREE.Vector3, b: THREE.Vector3, n = 80) {
  const dist = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1 + dist * 0.28));
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return curve.getPoints(n);
}

/** Reads the page's current paper/ink tokens so the globe follows ink mode. */
function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  return {
    paper: new THREE.Color(cs.getPropertyValue("--paper").trim() || PAPER),
    ink: new THREE.Color(cs.getPropertyValue("--ink").trim() || INK),
  };
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  const occluder = useRef<THREE.MeshBasicMaterial>(null);
  const inkMats = useRef<(THREE.Material | null)[]>([]);
  const tokens = useRef({ paper: new THREE.Color(PAPER), ink: new THREE.Color(INK) });

  useEffect(() => {
    tokens.current = readTokens();
    const mo = new MutationObserver(() => {
      tokens.current = readTokens();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const ring = useRef<THREE.Mesh>(null);
  const arcs = useRef<THREE.Line[]>([]);
  const { size } = useThree();
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0, drag: 0, dragging: false, lastX: 0 });

  const home = useMemo(() => latLon(site.coords.lat, site.coords.lon), []);
  const grid = useMemo(() => gridGeometry(), []);
  const others = useMemo(() => cities.filter((c) => c.name !== site.city), []);
  const arcGeos = useMemo(
    () =>
      others.map((c) => {
        const g = new THREE.BufferGeometry().setFromPoints(arcPoints(home, latLon(c.lat, c.lon)));
        g.setDrawRange(0, 0);
        return g;
      }),
    [others, home],
  );

  // base orientation: Colombo facing the camera
  const baseY = Math.atan2(-home.x, home.z);
  const baseX = site.coords.lat * D2R;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (pointer.current.dragging) {
        pointer.current.drag += (e.clientX - pointer.current.lastX) * 0.006;
        pointer.current.lastX = e.clientX;
      }
    };
    const up = () => (pointer.current.dragging = false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    const p = pointer.current;
    // ease the globe's paper/ink toward the page tokens, paced to the CSS cross-fade (~0.7s)
    const k = Math.min(1, dt * 2.2);
    occluder.current?.color.lerp(tokens.current.paper, k);
    inkMats.current.forEach((m) => {
      if (m && "color" in m) (m as THREE.MeshBasicMaterial).color.lerp(tokens.current.ink, k);
    });
    p.x += (p.tx - p.x) * 0.05;
    p.y += (p.ty - p.y) * 0.05;
    if (group.current) {
      group.current.rotation.y = baseY + Math.sin(t * 0.25) * 0.35 + p.x * 0.25 + p.drag;
      group.current.rotation.x = baseX + Math.sin(t * 0.18) * 0.08 + p.y * 0.15;
    }
    if (ring.current) {
      const s = 1 + ((t * 0.6) % 1) * 2.2;
      ring.current.scale.setScalar(s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 1 - ((t * 0.6) % 1);
    }
    // draw arcs progressively, staggered, looping every ~9s
    arcs.current.forEach((line, i) => {
      if (!line) return;
      const cycle = 9;
      const local = ((t + i * 0.7) % cycle) / cycle;
      const grow = THREE.MathUtils.smoothstep(local, 0, 0.35);
      const fade = 1 - THREE.MathUtils.smoothstep(local, 0.8, 1);
      line.geometry.setDrawRange(0, Math.floor(grow * 81));
      (line.material as THREE.LineBasicMaterial).opacity = 0.85 * fade;
    });
    void dt;
  });

  const isSmall = size.width < 600;

  return (
    <group
      ref={group}
      onPointerDown={(e) => {
        pointer.current.dragging = true;
        pointer.current.lastX = e.clientX;
      }}
    >
      {/* occluder: hides the back hemisphere lines */}
      <mesh>
        <sphereGeometry args={[R * 0.992, 48, 32]} />
        <meshBasicMaterial ref={occluder} color={PAPER} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial
          ref={(m) => {
            inkMats.current[0] = m;
          }}
          color={INK}
          transparent
          opacity={0.22}
        />
      </lineSegments>
      {/* equator + prime meridian slightly stronger */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 1.001, 0.0022, 8, 128]} />
        <meshBasicMaterial
          ref={(m) => {
            inkMats.current[1] = m;
          }}
          color={INK}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* home marker */}
      <mesh position={home}>
        <sphereGeometry args={[isSmall ? 0.022 : 0.018, 16, 16]} />
        <meshBasicMaterial color={ACCENT} />
      </mesh>
      <mesh ref={ring} position={home} onUpdate={(m) => m.lookAt(home.clone().multiplyScalar(2))}>
        <ringGeometry args={[0.02, 0.026, 32]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* cities + arcs */}
      {others.map((c, i) => {
        const v = latLon(c.lat, c.lon);
        return (
          <group key={c.name}>
            <mesh position={v}>
              <sphereGeometry args={[0.011, 12, 12]} />
              <meshBasicMaterial
                ref={(m) => {
                  inkMats.current[2 + i] = m;
                }}
                color={INK}
              />
            </mesh>
            <primitive
              object={new THREE.Line(arcGeos[i], new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.85 }))}
              ref={(el: THREE.Line) => {
                arcs.current[i] = el;
              }}
            />
          </group>
        );
      })}
    </group>
  );
}

export default function Globe() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 32, position: [0, 0, 3.6], near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ position: "absolute", inset: 0, touchAction: "pan-y" }}
    >
      <Scene />
    </Canvas>
  );
}
