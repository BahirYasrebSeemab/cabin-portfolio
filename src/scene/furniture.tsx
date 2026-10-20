import { useMemo } from "react";
import * as THREE from "three";
import { Block } from "./Cabin";

type Placement = { position: [number, number, number]; rotationY?: number; material: THREE.Material };

export const DESK = { width: 1.2, depth: 0.6, height: 0.75 };

export function Desk({ position, rotationY = 0, material }: Placement) {
  const { width: w, depth: d, height: h } = DESK;
  const legX = w / 2 - 0.06;
  const legZ = d / 2 - 0.06;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block size={[w, 0.045, d]} position={[0, h - 0.0225, 0]} material={material} />
      {[[-legX, -legZ], [legX, -legZ], [-legX, legZ], [legX, legZ]].map(([x, z]) => (
        <Block key={`${x}${z}`} size={[0.05, h - 0.045, 0.05]} position={[x, (h - 0.045) / 2, z]} material={material} />
      ))}
      <Block size={[w - 0.16, 0.08, 0.02]} position={[0, h - 0.09, -legZ]} material={material} />
    </group>
  );
}

// Spine colours of old cloth-bound books.
const BOOK_COLORS = ["#6b1f1a", "#2c4a35", "#7a5a2a", "#1f2f4a", "#8a6d3b", "#3b2a20", "#5a2d3c", "#9a8a6a", "#2e3b2a", "#a2522e"];

export const SHELF = { width: 1.0, depth: 0.32, height: 1.8, levels: [0.06, 0.48, 0.9, 1.32, 1.74] };

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Fills a shelf left to right with books of varied size; the last few lean.
function bookRow(rand: () => number, y: number, x0: number, x1: number) {
  const books: { x: number; y: number; w: number; h: number; d: number; tilt: number; color: string }[] = [];
  let x = x0;
  while (x < x1 - 0.03) {
    const w = 0.022 + rand() * 0.03;
    const h = 0.2 + rand() * 0.11;
    if (x + w > x1) break;
    books.push({ x: x + w / 2, y, w, h, d: 0.18 + rand() * 0.06, tilt: 0, color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)] });
    x += w + 0.002;
  }
  const last = books[books.length - 1];
  if (last && x1 - x > 0.06) last.tilt = -0.25;
  return books;
}

/** Built facing +z; `rotationY` turns it against a wall. `rows` = how many shelves (from the bottom) hold books. */
export function Bookshelf({ position, rotationY = 0, material, rows = 3 }: Placement & { rows?: number }) {
  const { width: w, depth: d, height: h, levels } = SHELF;
  const books = useMemo(() => {
    const rand = seeded(91);
    return levels.slice(0, rows).flatMap((y, i) => bookRow(rand, y + 0.022, -w / 2 + 0.05, w / 2 - (i === 1 ? 0.25 : 0.05)));
  }, [levels, rows, w]);
  const bookMesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
    const mesh = new THREE.InstancedMesh(geo, mat, books.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    books.forEach((b, i) => {
      q.setFromEuler(new THREE.Euler(0, 0, b.tilt));
      // Books stand on the shelf, pushed against the back panel.
      const shift = b.tilt ? Math.sin(-b.tilt) * b.h * 0.5 : 0;
      m.compose(new THREE.Vector3(b.x + shift, b.y + b.h / 2 - Math.abs(shift) * 0.2, -d / 2 + 0.015 + b.d / 2), q, new THREE.Vector3(b.w, b.h, b.d));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new THREE.Color(b.color));
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, [books, d]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Block size={[0.03, h, d]} position={[-w / 2 + 0.015, h / 2, 0]} material={material} />
      <Block size={[0.03, h, d]} position={[w / 2 - 0.015, h / 2, 0]} material={material} />
      <Block size={[w, h, 0.015]} position={[0, h / 2, -d / 2 + 0.0075]} material={material} />
      {levels.map((y) => (
        <Block key={y} size={[w - 0.06, 0.022, d]} position={[0, y + 0.011, 0]} material={material} />
      ))}
      <primitive object={bookMesh} />
    </group>
  );
}

// A bamboo flute: segmented tube with finger holes. Lies along local x.
export function Flute({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const LENGTH = 0.55;
  const R = 0.012;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, R, 0]} castShadow>
        <cylinderGeometry args={[R, R, LENGTH, 16]} />
        <meshStandardMaterial color="#c9a76a" roughness={0.45} />
      </mesh>
      {[-0.2, 0.05, 0.22].map((x) => (
        <mesh key={x} rotation={[0, 0, Math.PI / 2]} position={[x, R, 0]}>
          <cylinderGeometry args={[R * 1.08, R * 1.08, 0.012, 16]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.6} />
        </mesh>
      ))}
      {[-0.24, 0.0, 0.06, 0.1, 0.14, 0.18, 0.24].map((x, i) => (
        <mesh key={x} position={[x, R * 2 - 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[i === 0 ? 0.0055 : 0.0042, 12]} />
          <meshBasicMaterial color="#1a120a" />
        </mesh>
      ))}
    </group>
  );
}

// A rolled sleeping mat tied with two straps. Lies along local x.
export function Bedroll({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.11, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.6, 20]} />
        <meshStandardMaterial color="#3d5a3a" roughness={0.95} />
      </mesh>
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} rotation={[0, 0, Math.PI / 2]} position={[x, 0.11, 0]}>
          <cylinderGeometry args={[0.113, 0.113, 0.03, 20]} />
          <meshStandardMaterial color="#5a3a1f" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
