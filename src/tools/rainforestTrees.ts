// Dev-only: assembles tall Amazon-style trees from real scanned parts (bark
// texture, pachira leaf clusters, fern fronds) so bake.html can render them
// into forest cut-outs. Sizes are in metres.
import * as THREE from "three";

export type RainforestKind = "emergent" | "canopy" | "palm";

export type TreeParts = {
  bark: THREE.Material;
  /** Leaf clusters (pachira leaves_a..d), each centred on its own origin. */
  leafClusters: THREE.Object3D[];
  /** A whole fern plant, used scaled-up as a palm crown. */
  fernCrown: THREE.Object3D;
  vine: THREE.Material;
};

type Rand = () => number;

function seeded(seed: number): Rand {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const range = (rand: Rand, min: number, max: number) => min + rand() * (max - min);

/** A tapering limb along a curve, built from short cylinder segments. */
function limb(points: THREE.Vector3[], r0: number, r1: number, material: THREE.Material, segmentsPerSpan = 3) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points);
  const steps = (points.length - 1) * segmentsPerSpan;
  for (let i = 0; i < steps; i++) {
    const a = curve.getPoint(i / steps);
    const b = curve.getPoint((i + 1) / steps);
    const ra = THREE.MathUtils.lerp(r0, r1, i / steps);
    const rb = THREE.MathUtils.lerp(r0, r1, (i + 1) / steps);
    const length = a.distanceTo(b);
    // Slight overlap hides seams between segments.
    const geo = new THREE.CylinderGeometry(rb, ra, length * 1.04, 14, 1, true);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    group.add(mesh);
  }
  return group;
}

function leafCluster(parts: TreeParts, rand: Rand, position: THREE.Vector3, scale: number) {
  const source = parts.leafClusters[Math.floor(rand() * parts.leafClusters.length)];
  const leaves = source.clone(true);
  leaves.position.copy(position);
  leaves.rotation.set(range(rand, -0.3, 0.3), rand() * Math.PI * 2, range(rand, -0.3, 0.3));
  leaves.scale.setScalar(scale);
  return leaves;
}

/** Flattened dome of leaf clusters around a point. */
function crownCloud(parts: TreeParts, rand: Rand, center: THREE.Vector3, radius: number, count: number, clusterScale: number) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * radius;
    const up = range(rand, -0.35, 0.55) * radius;
    const p = new THREE.Vector3(center.x + Math.cos(a) * d, center.y + up, center.z + Math.sin(a) * d);
    group.add(leafCluster(parts, rand, p, clusterScale * range(rand, 0.75, 1.25)));
  }
  return group;
}

/** Wide flat roots that flare out from the base of big rainforest trees. */
function buttresses(material: THREE.Material, rand: Rand, baseRadius: number, height: number) {
  const group = new THREE.Group();
  const fins = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < fins; i++) {
    const reach = baseRadius * range(rand, 1.8, 3.2);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(reach, 0);
    shape.quadraticCurveTo(baseRadius * 0.9, height * 0.15, 0, height * range(rand, 0.75, 1));
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: baseRadius * 0.28, bevelEnabled: false });
    geo.translate(0, 0, -baseRadius * 0.14);
    const fin = new THREE.Mesh(geo, material);
    fin.rotation.y = (i / fins) * Math.PI * 2 + range(rand, -0.25, 0.25);
    group.add(fin);
  }
  return group;
}

/** Hanging lianas: thin wavy cords from the branches toward the ground. */
function lianas(parts: TreeParts, rand: Rand, anchors: THREE.Vector3[], groundY: number) {
  const group = new THREE.Group();
  for (const top of anchors) {
    const drop = (top.y - groundY) * range(rand, 0.35, 0.8);
    const points = Array.from({ length: 5 }, (_, i) => {
      const t = i / 4;
      return new THREE.Vector3(top.x + Math.sin(t * 5 + rand()) * 0.4, top.y - drop * t, top.z + Math.cos(t * 4 + rand()) * 0.4);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 5, false), parts.vine));
    for (let i = 1; i < 4; i++) group.add(leafCluster(parts, rand, curve.getPoint(i / 4), 0.9));
  }
  return group;
}

// Emergent: the giants that poke above the canopy (kapok, Brazil nut). Very tall,
// straight bare trunk, branches only near the top, a broad umbrella crown.
function emergent(parts: TreeParts, rand: Rand) {
  const tree = new THREE.Group();
  const height = range(rand, 44, 52);
  const lean = new THREE.Vector3(range(rand, -0.8, 0.8), 0, range(rand, -0.8, 0.8));
  const branchStart = height * 0.74;
  const trunkTop = new THREE.Vector3(lean.x, branchStart, lean.z);
  tree.add(limb([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean.x * 0.3, height * 0.35, lean.z * 0.3), trunkTop, trunkTop.clone().setY(height * 0.86)], 1.0, 0.38, parts.bark));
  tree.add(buttresses(parts.bark, rand, 1.0, 3.5));
  const tips: THREE.Vector3[] = [];
  const branches = 6 + Math.floor(rand() * 3);
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + range(rand, -0.3, 0.3);
    const reach = range(rand, 4.5, 7);
    const start = trunkTop.clone().setY(branchStart + range(rand, 0, height * 0.1));
    const tip = start.clone().add(new THREE.Vector3(Math.cos(a) * reach, range(rand, 3, 6), Math.sin(a) * reach));
    const mid = start.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, range(rand, 1, 2.5), 0));
    tree.add(limb([start, mid, tip], 0.32, 0.08, parts.bark, 2));
    tips.push(tip);
    tree.add(crownCloud(parts, rand, tip, range(rand, 2.8, 3.8), 14, 4.2));
  }
  tree.add(crownCloud(parts, rand, new THREE.Vector3(lean.x, height * 0.95, lean.z), 5, 14, 4.2));
  tree.add(lianas(parts, rand, tips.slice(0, 4).map((t) => t.clone().lerp(trunkTop, 0.35)), 0));
  return tree;
}

// Canopy tree: the main layer. Shorter, denser, rounder crown starting lower.
function canopy(parts: TreeParts, rand: Rand) {
  const tree = new THREE.Group();
  const height = range(rand, 32, 38);
  const top = new THREE.Vector3(range(rand, -0.6, 0.6), height * 0.8, range(rand, -0.6, 0.6));
  tree.add(limb([new THREE.Vector3(0, 0, 0), new THREE.Vector3(top.x * 0.4, height * 0.4, top.z * 0.4), top], 0.65, 0.3, parts.bark));
  tree.add(buttresses(parts.bark, rand, 0.65, 2.2));
  const anchors: THREE.Vector3[] = [];
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2;
    const y = range(rand, height * 0.55, height * 0.85);
    const tip = new THREE.Vector3(top.x + Math.cos(a) * range(rand, 2.5, 4.5), y + range(rand, 1, 3), top.z + Math.sin(a) * range(rand, 2.5, 4.5));
    tree.add(limb([new THREE.Vector3(top.x, y, top.z), tip], 0.22, 0.06, parts.bark, 2));
    tree.add(crownCloud(parts, rand, tip, range(rand, 2.2, 3), 12, 3.4));
    anchors.push(tip);
  }
  tree.add(crownCloud(parts, rand, new THREE.Vector3(top.x, height * 0.9, top.z), 4.5, 18, 3.6));
  tree.add(lianas(parts, rand, anchors.slice(0, 3), 0));
  return tree;
}

/** One feathery palm frond: an arching stem with thin leaflets down both sides, drooping at the tips. */
function frond(rand: Rand, material: THREE.Material, length: number) {
  const group = new THREE.Group();
  const rise = length * range(rand, 0.25, 0.4);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.45, rise, 0),
    new THREE.Vector3(length, rise - length * range(rand, 0.55, 0.8), 0),
  );
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.04, 4, false), material));
  const leaflet = new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0);
  const count = 34;
  for (let i = 2; i < count; i++) {
    const t = i / count;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const len = length * 0.24 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.15;
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(leaflet, material);
      leaf.position.copy(p);
      // Leaflets fan out sideways from the stem and hang down.
      leaf.lookAt(p.clone().add(tangent));
      leaf.rotateY(side * Math.PI * 0.5 + side * range(rand, -0.25, 0.15));
      leaf.rotateZ(-range(rand, 0.5, 0.9));
      leaf.scale.set(len, 0.09, 1);
      group.add(leaf);
    }
  }
  return group;
}

// Palm (açaí-style): thin ringed trunk with a slight curve and a crown of feathery fronds.
function palm(parts: TreeParts, rand: Rand) {
  const tree = new THREE.Group();
  const height = range(rand, 15, 20);
  const bend = new THREE.Vector3(range(rand, -1.5, 1.5), 0, range(rand, -1.5, 1.5));
  const top = new THREE.Vector3(bend.x, height, bend.z);
  tree.add(limb([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bend.x * 0.2, height * 0.5, bend.z * 0.2), top], 0.17, 0.12, parts.bark, 6));
  const leafMaterial = new THREE.MeshStandardMaterial({ color: "#2f5428", roughness: 0.8, side: THREE.DoubleSide });
  const fronds = 11 + Math.floor(rand() * 4);
  for (let i = 0; i < fronds; i++) {
    const f = frond(rand, leafMaterial, range(rand, 3.8, 5.2));
    f.position.copy(top);
    f.rotation.y = (i / fronds) * Math.PI * 2 + range(rand, -0.2, 0.2);
    f.rotation.z = range(rand, -0.15, 0.35);
    tree.add(f);
  }
  return tree;
}

const BUILDERS: Record<RainforestKind, (parts: TreeParts, rand: Rand) => THREE.Group> = { emergent, canopy, palm };

export function buildRainforestTree(kind: RainforestKind, seed: number, parts: TreeParts): THREE.Group {
  return BUILDERS[kind](parts, seeded(seed));
}
