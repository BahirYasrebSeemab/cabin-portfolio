import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FLOOR_Y, WALL_H, ROOF_RISE, CABIN_W } from "./layout";
import type { LiveLighting } from "./lighting";
import { Model } from "./Model";

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

type Placement = { position: [number, number, number]; rotationY?: number };

export function WorldMap({ position, rotationY = 0 }: Placement) {
  const map = useMemo(
    () =>
      canvasTexture(1024, 600, (ctx) => {
        ctx.fillStyle = "#d9c49a";
        ctx.fillRect(0, 0, 1024, 600);
        ctx.strokeStyle = "rgba(90,60,30,0.22)";
        ctx.lineWidth = 2;
        for (let x = 0; x <= 1024; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 600);
          ctx.stroke();
        }
        for (let y = 0; y <= 600; y += 64) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(1024, y);
          ctx.stroke();
        }
        ctx.fillStyle = "#5a3d22";
        ctx.textAlign = "center";
        ctx.font = "bold 48px Georgia, serif";
        ctx.fillText("WORLD MAP", 512, 290);
        ctx.font = "italic 30px Georgia, serif";
        ctx.fillText("(real map + pins go here)", 512, 340);
        for (const [x, y] of [[700, 210], [540, 180], [260, 230], [820, 400]]) {
          ctx.fillStyle = "#b3261e";
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.fill();
        }
      }),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.01]} castShadow>
        <boxGeometry args={[1.08, 0.68, 0.03]} />
        <meshStandardMaterial color="#3a2414" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function MooseMount({ position, rotationY = 0 }: Placement) {
  const label = useMemo(
    () =>
      canvasTexture(512, 160, (ctx) => {
        ctx.fillStyle = "#2b1a0e";
        ctx.fillRect(0, 0, 512, 160);
        ctx.strokeStyle = "#c9a227";
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 140);
        ctx.fillStyle = "#e3c869";
        ctx.textAlign = "center";
        ctx.font = "bold 46px Georgia, serif";
        ctx.fillText("RESERVED", 256, 72);
        ctx.font = "italic 30px Georgia, serif";
        ctx.fillText("for the moose", 256, 118);
      }),
    [],
  );
  const shield = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.26, 0.22);
    s.quadraticCurveTo(0, 0.3, 0.26, 0.22);
    s.lineTo(0.24, -0.08);
    s.quadraticCurveTo(0.18, -0.26, 0, -0.32);
    s.quadraticCurveTo(-0.18, -0.26, -0.24, -0.08);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  }, []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={shield} castShadow>
        <meshStandardMaterial color="#5b3a1f" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.44, 0.02]}>
        <planeGeometry args={[0.5, 0.16]} />
        <meshStandardMaterial map={label} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Rug({ position, rotationY = 0 }: Placement) {
  const map = useMemo(
    () =>
      canvasTexture(512, 768, (ctx) => {
        ctx.fillStyle = "#6e1f1a";
        ctx.fillRect(0, 0, 512, 768);
        ctx.strokeStyle = "#d4a24a";
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, 452, 708);
        ctx.strokeStyle = "#1f3b2e";
        ctx.lineWidth = 22;
        ctx.strokeRect(70, 70, 372, 628);
        ctx.fillStyle = "#d4a24a";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(256, 170 + i * 110);
          ctx.lineTo(306, 220 + i * 110);
          ctx.lineTo(256, 270 + i * 110);
          ctx.lineTo(206, 220 + i * 110);
          ctx.closePath();
          ctx.fill();
        }
      }),
    [],
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, rotationY]} position={[position[0], FLOOR_Y + 0.005, position[2]]} receiveShadow>
      <planeGeometry args={[1.0, 1.5]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

// The frame model is bare springs; add a mattress, a wool blanket and a pillow.
// Built along local z (head at -z), then turned by `rotationY`.
export function Bed({ position, rotationY = 0 }: Placement) {
  const blanket = useMemo(
    () =>
      canvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = "#24452f";
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = "rgba(120, 30, 24, 0.75)";
        for (let i = 0; i < 256; i += 64) {
          ctx.fillRect(i, 0, 18, 256);
          ctx.fillRect(0, i, 256, 18);
        }
        ctx.fillStyle = "rgba(230, 200, 140, 0.35)";
        for (let i = 30; i < 256; i += 64) {
          ctx.fillRect(i, 0, 4, 256);
          ctx.fillRect(0, i, 256, 4);
        }
      }),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Model id="old_bed_frame" position={[0, 0, 0]} />
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.16, 1.88]} />
        <meshStandardMaterial color="#d8cfbf" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.6, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.05, 1.3]} />
        <meshStandardMaterial map={blanket} roughness={1} />
      </mesh>
      <RoundedBox args={[0.62, 0.1, 0.36]} radius={0.045} smoothness={4} position={[0, 0.63, -0.7]} castShadow>
        <meshStandardMaterial color="#efe7d6" roughness={1} />
      </RoundedBox>
    </group>
  );
}

const ROOF_PITCH = Math.atan2(ROOF_RISE, CABIN_W / 2);
const RIDGE_Y = FLOOR_Y + WALL_H + ROOF_RISE;

export function Stove({ position, live }: { position: [number, number, number]; live: LiveLighting }) {
  const light = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const [x, y, z] = position;
  const stoveTop = y + 0.86;
  // Pipe runs from the stove up through the roof.
  const pipeTop = RIDGE_Y - Math.abs(x) * Math.tan(ROOF_PITCH) + 0.6;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = 0.82 + 0.1 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1 + 1.7) + 0.04 * Math.sin(t * 23.7);
    if (light.current) light.current.intensity = live.fireIntensity * flicker;
    if (glow.current) glow.current.color.setRGB(1.4 * flicker, 0.55 * flicker, 0.12);
  });
  return (
    <group>
      <Model id="barrel_stove" position={position} rotationY={-Math.PI / 2} />
      <mesh position={[x, (stoveTop + pipeTop) / 2, z]}>
        <cylinderGeometry args={[0.07, 0.07, pipeTop - stoveTop, 16]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[x - 0.31, y + 0.42, z]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 20]} />
        <meshBasicMaterial ref={glow} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[x - 0.5, y + 0.6, z]} color="#ff8a3c" distance={7} decay={1.6} />
    </group>
  );
}

export function Lantern({ position, live, strength = 1 }: { position: [number, number, number]; live: LiveLighting; strength?: number }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = live.lanternIntensity * strength * (0.95 + 0.05 * Math.sin(clock.elapsedTime * 11));
  });
  return (
    <group>
      <Model id="Lantern_01" position={position} height={0.3} />
      <pointLight ref={light} position={[position[0], position[1] + 0.16, position[2]]} color="#ffb260" distance={5} decay={1.8} />
    </group>
  );
}
