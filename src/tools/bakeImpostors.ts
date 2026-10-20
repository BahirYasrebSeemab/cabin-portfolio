// Dev-only: renders ONE real 3D plant model (bake.html?cell=N) into a flat
// cut-out image for the forest layers. One model per page load keeps memory
// low enough for big trees. assemble.html then stitches the cells together.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { IMPOSTOR_CELL, IMPOSTORS } from "../scene/forestConfig";
import { modelUrl } from "../scene/Model";

declare global {
  interface Window {
    __cell?: string;
    __bakeError?: string;
  }
}

const { width: CELL_W, height: CELL_H } = IMPOSTOR_CELL;
// Leaves in these models are glossy; at forest distance that reads as white glare.
const MIN_ROUGHNESS = 0.7;

function makeRenderer() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(CELL_W, CELL_H);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function makeScene(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  // Same light direction the cabin gets by day: from the upper left, slightly in front.
  const sun = new THREE.DirectionalLight("#fff1da", 2.0);
  sun.position.set(-3, 5, 4);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight("#cfe3c8", "#24331b", 0.6));
  return scene;
}

function matte(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if ("roughness" in mat) mat.roughness = Math.max(mat.roughness, MIN_ROUGHNESS);
  });
}

async function bake(index: number) {
  const imp = IMPOSTORS[index];
  if (!imp) throw new Error(`no impostor ${index}`);
  const renderer = makeRenderer();
  const scene = makeScene(renderer);
  const gltf = await new GLTFLoader().loadAsync(modelUrl(imp.model));
  const plant = gltf.scene;
  if (imp.variant) for (const child of [...plant.children]) if (!child.name.endsWith(`_${imp.variant}`)) plant.remove(child);
  plant.rotation.y = imp.angle;
  matte(plant);
  scene.add(plant);
  plant.updateMatrixWorld(true);

  // Fit an orthographic camera with the cell's 1:2 aspect, base on the bottom edge.
  const box = new THREE.Box3().setFromObject(plant);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const aspect = CELL_W / CELL_H;
  const viewH = Math.max(size.y, size.x / aspect) * 1.03;
  const viewW = viewH * aspect;
  const camera = new THREE.OrthographicCamera(-viewW / 2, viewW / 2, viewH, 0, 0.01, 1000);
  camera.position.set(center.x, box.min.y, center.z + Math.max(size.z, 10) * 2);
  camera.lookAt(center.x, box.min.y, center.z);
  renderer.render(scene, camera);
  // Shown on the page too, so a single cell can be previewed by eye.
  document.body.style.background = "#556b55";
  document.body.appendChild(renderer.domElement);
  window.__cell = renderer.domElement.toDataURL("image/png");
}

const index = Number(new URLSearchParams(window.location.search).get("cell") ?? 0);
bake(index).catch((e: unknown) => {
  window.__bakeError = e instanceof Error ? e.message : String(e);
});
