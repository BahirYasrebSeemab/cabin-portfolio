import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { PORCH_D, DOOR } from "./layout";
import { Model } from "./Model";
import { VIEWPOINTS } from "./viewpoints";

const FLOOR_RADIUS = 14;
const TILE_METRES = 2.5;
const CENTER_Z = -1.9;
// Real 3D undergrowth close to the cabin, so it blends into the painted forest behind.
// `variants` are the suffixes of the separate plants packed into each file.
const PLANTS = [
  { id: "fern_02", variants: "abcd", minH: 0.5, maxH: 1.1, weight: 0.4 },
  { id: "pachira_aquatica_01", variants: "abcd", minH: 1.2, maxH: 2.2, weight: 0.2 },
  { id: "calathea_orbifolia_01", variants: "abcde", minH: 0.5, maxH: 0.9, weight: 0.2 },
  { id: "shrub_03", variants: "abcd", minH: 0.8, maxH: 1.5, weight: 0.12 },
  { id: "anthurium_botany_01", variants: "abc", minH: 0.5, maxH: 0.8, weight: 0.08 },
];

// Soft radial mask so the textured floor dissolves into the darker ground beyond.
function radialFade() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#fff");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function isClearZone(x: number, z: number) {
  const [cx, , cz] = VIEWPOINTS.porch.position;
  const doorX = (DOOR.x0 + DOOR.x1) / 2;
  const inViewCorridor = distanceToSegment(x, z, cx, cz, 0, 0.5) < 1.8;
  const onPath = Math.abs(x - doorX) < 1.1 && z > PORCH_D - 0.2;
  const underCabin = Math.abs(x) < 3.2 && z > -4.6 && z < PORCH_D + 0.3;
  return inViewCorridor || onPath || underCabin;
}

// Deterministic scatter so the layout is the same on every load.
function scatter(count: number, seed: number) {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out: { id: string; variant: string; x: number; z: number; rot: number; h: number }[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const angle = rand() * Math.PI * 2;
    const r = 3.4 + rand() * 7.5;
    const x = Math.cos(angle) * r;
    const z = CENTER_Z + Math.sin(angle) * r;
    if (isClearZone(x, z)) continue;
    let pick = rand();
    const plant = PLANTS.find((p) => (pick -= p.weight) < 0) ?? PLANTS[0];
    const variant = plant.variants[Math.floor(rand() * plant.variants.length)];
    out.push({ id: plant.id, variant, x, z, rot: rand() * Math.PI * 2, h: plant.minH + rand() * (plant.maxH - plant.minH) });
  }
  return out;
}

export function Ground({ plants: showPlants = true }: { plants?: boolean }) {
  const maps = useTexture({
    map: "/assets/textures/forest_floor/diff.jpg",
    normalMap: "/assets/textures/forest_floor/nor.jpg",
    roughnessMap: "/assets/textures/forest_floor/rough.jpg",
  });
  const floorMaterial = useMemo(() => {
    const repeat = (FLOOR_RADIUS * 2) / TILE_METRES;
    for (const tex of Object.values(maps)) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      tex.anisotropy = 8;
    }
    maps.map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ ...maps, alphaMap: radialFade(), transparent: true, depthWrite: false, color: "#8f9a7a" });
  }, [maps]);
  const plants = useMemo(() => scatter(34, 7), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CENTER_Z]} receiveShadow>
        <circleGeometry args={[200, 48]} />
        <meshStandardMaterial color="#26331d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, CENTER_Z]} material={floorMaterial} receiveShadow renderOrder={-1}>
        <circleGeometry args={[FLOOR_RADIUS, 64]} />
      </mesh>
      {showPlants && plants.map((p, i) => (
        <Model key={i} id={p.id} variant={p.variant} position={[p.x, 0, p.z]} rotationY={p.rot} height={p.h} />
      ))}
    </group>
  );
}
