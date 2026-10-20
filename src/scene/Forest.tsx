import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FOREST_BLUR_LEVELS, FOREST_RINGS, forestAtlasUrl, IMPOSTOR_ASPECT, IMPOSTORS, type ImpostorKind, type Ring } from "./forestConfig";
import type { LiveLighting } from "./lighting";

const CENTER = new THREE.Vector2(0, -1.9);

const vertexShader = /* glsl */ `
  attribute float aVariant;
  attribute float aPhase;
  uniform float uTime;
  uniform float uVariants;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vec3 center = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float sx = length(instanceMatrix[0].xyz);
    float sy = length(instanceMatrix[1].xyz);
    // Cylindrical billboard: always face the camera, stay upright.
    vec3 toCam = cameraPosition - center;
    toCam.y = 0.0;
    vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x));
    // Sway grows toward the canopy.
    float sway = sin(uTime * 0.7 + aPhase) * 0.035 * position.y * position.y;
    vec3 world = center + right * (position.x + sway) * sx + vec3(0.0, position.y * sy, 0.0);
    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vUv = vec2((uv.x + aVariant) / uVariants, uv.y);
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform float uAlphaTest;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    // The atlas is uploaded premultiplied, so filtering can't bleed the colour of
    // invisible pixels into leaf edges; divide alpha back out for the true colour.
    vec4 c = texture2D(uMap, vUv);
    if (c.a < uAlphaTest) discard;
    vec3 rgb = c.rgb / max(c.a, 0.0001);
    // Baked images are already tone-mapped, so skip tone mapping here.
    gl_FragColor = vec4(rgb * uTint, uAlphaTest > 0.1 ? 1.0 : c.a);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const indicesOf = (kind: ImpostorKind) => IMPOSTORS.flatMap((imp, i) => (imp.kind === kind ? [i] : []));
const BY_KIND: Record<ImpostorKind, number[]> = { tree: indicesOf("tree"), mid: indicesOf("mid"), bush: indicesOf("bush") };
// Share of each kind per layer: tree rings are mostly big trees, undergrowth mostly bushes.
const LAYER_MIX: Record<Ring["layer"], [ImpostorKind, number][]> = {
  trees: [["tree", 0.7], ["mid", 0.3]],
  undergrowth: [["bush", 0.7], ["mid", 0.3]],
};

function pickVariant(layer: Ring["layer"], rand: () => number) {
  let r = rand();
  const [kind] = LAYER_MIX[layer].find(([, share]) => (r -= share) < 0) ?? LAYER_MIX[layer][0];
  const options = BY_KIND[kind];
  return options[Math.floor(rand() * options.length)];
}

function buildRing(ring: Ring, index: number, map: THREE.Texture, tint: THREE.Color) {
  const rand = seeded(4242 + index * 131);
  const count = Math.floor((Math.PI * 2 * ring.radius) / ring.spacing);
  const geometry = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const variants = new Float32Array(count);
  const phases = new Float32Array(count);
  const isSharp = ring.blur === 0;
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { uTime: { value: 0 }, uVariants: { value: IMPOSTORS.length }, uAlphaTest: { value: isSharp ? 0.45 : 0.02 }, uTint: { value: tint }, uMap: { value: null } },
    ]),
    fog: true,
    transparent: !isSharp,
    depthWrite: isSharp,
    side: THREE.DoubleSide,
  });
  // UniformsUtils.merge clones values; re-attach the shared tint and texture.
  material.uniforms.uTint.value = tint;
  material.uniforms.uMap.value = map;

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.25;
    const r = ring.radius + (rand() - 0.5) * 2 * ring.jitter;
    const variant = pickVariant(ring.layer, rand);
    let h = ring.minH + rand() * (ring.maxH - ring.minH);
    const kind = IMPOSTORS[variant].kind;
    // Mid-height plants fill the space under the canopy of tree rings.
    if (ring.layer === "trees" && kind === "mid") h *= 0.5;
    // The big trees are wider than tall, so they only fill the lower half of their
    // 1:2 image; double the card so the tree itself reaches the ring's height.
    if (kind === "tree") h *= 2;
    m.makeScale(h * IMPOSTOR_ASPECT, h, 1).setPosition(CENTER.x + Math.cos(angle) * r, 0, CENTER.y + Math.sin(angle) * r);
    mesh.setMatrixAt(i, m);
    variants[i] = variant;
    phases[i] = rand() * Math.PI * 2;
  }
  geometry.setAttribute("aVariant", new THREE.InstancedBufferAttribute(variants, 1));
  geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
  // Billboards move in the shader, so the default bounds are wrong; never cull.
  mesh.frustumCulled = false;
  // Far rings draw first so nearer blended layers sit on top of them.
  mesh.renderOrder = -index;
  return { mesh, material };
}

export function Forest({ live }: { live: LiveLighting }) {
  const atlases = useTexture(FOREST_BLUR_LEVELS.map(forestAtlasUrl));
  const rings = useMemo(() => {
    for (const tex of atlases) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.premultiplyAlpha = true;
      tex.needsUpdate = true;
    }
    // Test-only: ?rings=N renders just the N innermost rings.
    const limit = Number(new URLSearchParams(window.location.search).get("rings") ?? FOREST_RINGS.length);
    return FOREST_RINGS.slice(0, limit).map((ring, i) => buildRing(ring, i, atlases[FOREST_BLUR_LEVELS.indexOf(ring.blur)], live.forestTint));
  }, [atlases, live]);

  useFrame(({ clock }) => {
    for (const { material } of rings) material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <>
      {rings.map(({ mesh }, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  );
}
