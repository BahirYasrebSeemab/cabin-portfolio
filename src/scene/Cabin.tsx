import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { tiledBox } from "./tiledBox";
import { CABIN_D, CABIN_W, DOOR, FLOOR_Y, FRONT_WINDOW, PORCH_D, ROOF_RISE, SIDE_WINDOW, WALL_H, WALL_T } from "./layout";

const HALF_W = CABIN_W / 2;
const ROOF_PITCH = Math.atan2(ROOF_RISE, HALF_W);
const RIDGE_Y = FLOOR_Y + WALL_H + ROOF_RISE;
const ROOF_OVERHANG = 0.4;

type Opening = { x: number; y: number; w: number; h: number };

export function usePbr(name: string, tint = "#ffffff") {
  const maps = useTexture({
    map: `/assets/textures/${name}/diff.jpg`,
    normalMap: `/assets/textures/${name}/nor.jpg`,
    roughnessMap: `/assets/textures/${name}/rough.jpg`,
  });
  return useMemo(() => {
    for (const tex of Object.values(maps)) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 8;
    }
    maps.map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ ...maps, color: tint, roughness: 1 });
  }, [maps, tint]);
}

export function Block({ size, position, rotation, material, tile = 1, swap = false }: {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  tile?: number;
  swap?: boolean;
}) {
  const geo = useMemo(() => tiledBox(size[0], size[1], size[2], tile, swap), [size, tile, swap]);
  return <mesh geometry={geo} material={material} position={position} rotation={rotation} castShadow receiveShadow />;
}

// Log ends crossing at each corner — the detail that reads as "log cabin".
function CornerLogs({ material }: { material: THREE.Material }) {
  const LOG_R = 0.12;
  const count = Math.floor(WALL_H / (LOG_R * 2));
  const mesh = useMemo(() => {
    const geo = new THREE.CylinderGeometry(LOG_R, LOG_R, 0.6, 12);
    const inst = new THREE.InstancedMesh(geo, material, count * 4 * 2);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    const alongX = new THREE.Euler(0, 0, Math.PI / 2);
    const alongZ = new THREE.Euler(Math.PI / 2, 0, 0);
    let i = 0;
    const cx = HALF_W + 0.05;
    for (const [x, z] of [[-cx, 0.05], [cx, 0.05], [-cx, -CABIN_D - 0.05], [cx, -CABIN_D - 0.05]]) {
      for (let row = 0; row < count; row++) {
        // Alternate which wall's log sits on top, like real notched corners.
        const y = FLOOR_Y + LOG_R + row * LOG_R * 2;
        const even = row % 2 === 0;
        m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(even ? alongX : alongZ), s);
        inst.setMatrixAt(i++, m);
        m.compose(new THREE.Vector3(x, y + LOG_R, z), q.setFromEuler(even ? alongZ : alongX), s);
        inst.setMatrixAt(i++, m);
      }
    }
    inst.castShadow = true;
    inst.receiveShadow = true;
    return inst;
  }, [material, count]);
  return <primitive object={mesh} />;
}

// A wall running along its local +x from 0 to `length`, with rectangular holes.
function Wall({ length, openings = [], material, ...group }: {
  length: number;
  openings?: Opening[];
  material: THREE.Material;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const blocks = useMemo(() => {
    const out: { size: [number, number, number]; position: [number, number, number] }[] = [];
    const push = (x0: number, x1: number, y0: number, y1: number) => {
      if (x1 - x0 > 0.001 && y1 - y0 > 0.001)
        out.push({ size: [x1 - x0, y1 - y0, WALL_T], position: [(x0 + x1) / 2, (y0 + y1) / 2, 0] });
    };
    let cursor = 0;
    for (const o of [...openings].sort((a, b) => a.x - b.x)) {
      push(cursor, o.x, 0, WALL_H);
      push(o.x, o.x + o.w, 0, o.y);
      push(o.x, o.x + o.w, o.y + o.h, WALL_H);
      cursor = o.x + o.w;
    }
    push(cursor, length, 0, WALL_H);
    return out;
  }, [length, openings]);

  return (
    <group {...group}>
      {blocks.map((b, i) => (
        <Block key={i} size={b.size} position={b.position} material={material} tile={1.8} swap />
      ))}
    </group>
  );
}

function Gable({ z, material }: { z: number; material: THREE.Material }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-HALF_W - 0.1, 0);
    shape.lineTo(HALF_W + 0.1, 0);
    shape.lineTo(0, ROOF_RISE + 0.05);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false });
    g.translate(0, 0, -WALL_T / 2);
    // Extrude UVs are in shape units (metres); turn and scale to match the walls.
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) / 1.8, uv.getX(i) / 1.8);
    return g;
  }, []);
  return <mesh geometry={geo} material={material} position={[0, FLOOR_Y + WALL_H, z]} castShadow receiveShadow />;
}

export function WindowFrame({ width, height, material }: { width: number; height: number; material: THREE.Material }) {
  const t = 0.07;
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#d8efe0", transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false }),
    [],
  );
  return (
    <group>
      <Block size={[width + t, t, 0.24]} position={[0, -height / 2, 0]} material={material} />
      <Block size={[width + t, t, 0.24]} position={[0, height / 2, 0]} material={material} />
      <Block size={[t, height, 0.24]} position={[-width / 2, 0, 0]} material={material} />
      <Block size={[t, height, 0.24]} position={[width / 2, 0, 0]} material={material} />
      <Block size={[0.035, height, 0.05]} position={[0, 0, 0]} material={material} />
      <Block size={[width, 0.035, 0.05]} position={[0, 0, 0]} material={material} />
      <mesh material={glass}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}

export function useCabinMaterials() {
  return {
    logs: usePbr("wood_trunk_wall", "#b59a80"),
    floor: usePbr("old_wood_floor"),
    deck: usePbr("wood_floor_deck", "#8a8073"),
    roof: usePbr("roof_planks", "#6f6258"),
    trim: usePbr("roof_planks", "#4a3a2c"),
    stone: usePbr("rustic_stone_wall", "#9a9a90"),
  };
}

export function Cabin() {
  const { logs, floor, deck, roof, trim, stone } = useCabinMaterials();

  const frontLeft = -HALF_W - 0.1;
  const fw = FRONT_WINDOW;
  const sw = SIDE_WINDOW;
  const roofHalf = HALF_W + ROOF_OVERHANG;
  const roofSlope = roofHalf / Math.cos(ROOF_PITCH);
  const roofBack = -CABIN_D - ROOF_OVERHANG;
  const roofFront = PORCH_D + 0.2;
  const roofDepth = roofFront - roofBack;
  const roofCenterZ = (roofFront + roofBack) / 2;
  const roofCenterY = RIDGE_Y - (roofHalf / 2) * Math.tan(ROOF_PITCH);
  const porchW = CABIN_W + 1.0;
  const postX = porchW / 2 - 0.15;
  // Height of the roof's underside directly above the porch posts.
  const postTop = RIDGE_Y - postX * Math.tan(ROOF_PITCH) - 0.1;

  return (
    <group>
      {/* Foundation + interior floor */}
      <Block size={[CABIN_W + 0.2, FLOOR_Y - 0.02, CABIN_D + 0.2]} position={[0, (FLOOR_Y - 0.02) / 2, -CABIN_D / 2]} material={stone} />
      <Block size={[CABIN_W, 0.04, CABIN_D]} position={[0, FLOOR_Y - 0.02, -CABIN_D / 2]} material={floor} tile={2} />

      {/* Front wall: window (left) and door (right) */}
      <Wall length={CABIN_W + 0.2} position={[frontLeft, FLOOR_Y, 0]} material={logs}
        openings={[
          { x: fw.x0 - frontLeft, y: fw.y0, w: fw.x1 - fw.x0, h: fw.y1 - fw.y0 },
          { x: DOOR.x0 - frontLeft, y: 0, w: DOOR.x1 - DOOR.x0, h: DOOR.height },
        ]} />
      <Wall length={CABIN_W + 0.2} position={[frontLeft, FLOOR_Y, -CABIN_D]} material={logs} />
      {/* Side walls run from the front wall toward the back: local x = -0.1 - z */}
      <Wall length={CABIN_D - 0.2} position={[-HALF_W, FLOOR_Y, -0.1]} rotation={[0, Math.PI / 2, 0]} material={logs}
        openings={[{ x: -0.1 - sw.z1, y: sw.y0, w: sw.z1 - sw.z0, h: sw.y1 - sw.y0 }]} />
      <Wall length={CABIN_D - 0.2} position={[HALF_W, FLOOR_Y, -0.1]} rotation={[0, Math.PI / 2, 0]} material={logs} />
      <Gable z={0} material={logs} />
      <Gable z={-CABIN_D} material={logs} />
      <CornerLogs material={logs} />

      {/* Windows */}
      <group position={[(fw.x0 + fw.x1) / 2, FLOOR_Y + (fw.y0 + fw.y1) / 2, 0]}>
        <WindowFrame width={fw.x1 - fw.x0} height={fw.y1 - fw.y0} material={trim} />
      </group>
      <group position={[-HALF_W, FLOOR_Y + (sw.y0 + sw.y1) / 2, (sw.z0 + sw.z1) / 2]} rotation={[0, Math.PI / 2, 0]}>
        <WindowFrame width={sw.z1 - sw.z0} height={sw.y1 - sw.y0} material={trim} />
      </group>

      {/* Roof */}
      <Block size={[roofSlope, 0.14, roofDepth]} material={roof} position={[-roofHalf / 2, roofCenterY, roofCenterZ]} rotation={[0, 0, ROOF_PITCH]} />
      <Block size={[roofSlope, 0.14, roofDepth]} material={roof} position={[roofHalf / 2, roofCenterY, roofCenterZ]} rotation={[0, 0, -ROOF_PITCH]} />
      <Block size={[0.18, 0.18, roofDepth + 0.1]} position={[0, RIDGE_Y + 0.02, roofCenterZ]} material={logs} />

      {/* Porch: deck, posts, beam, steps */}
      <Block size={[porchW, 0.1, PORCH_D]} position={[0, FLOOR_Y - 0.05, PORCH_D / 2]} material={deck} tile={1.5} />
      <Block size={[porchW, FLOOR_Y - 0.1, 0.2]} position={[0, (FLOOR_Y - 0.1) / 2, PORCH_D - 0.1]} material={stone} />
      {[-postX, postX].map((x) => (
        <Block key={x} size={[0.15, postTop - FLOOR_Y, 0.15]} position={[x, (postTop + FLOOR_Y) / 2, PORCH_D - 0.12]} material={logs} tile={1.8} />
      ))}
      <Block size={[porchW, 0.15, 0.15]} position={[0, postTop, PORCH_D - 0.12]} material={logs} tile={1.8} />
      <Block size={[1.3, 0.13, 0.33]} position={[(DOOR.x0 + DOOR.x1) / 2, 0.2, PORCH_D + 0.16]} material={deck} />
      <Block size={[1.3, 0.13, 0.33]} position={[(DOOR.x0 + DOOR.x1) / 2, 0.065, PORCH_D + 0.45]} material={deck} />
    </group>
  );
}
