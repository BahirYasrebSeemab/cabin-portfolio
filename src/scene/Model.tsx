import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type ModelProps = {
  id: string;
  position: [number, number, number];
  rotationY?: number;
  /** Scale uniformly so the model is this tall (metres). Omit to keep real-world size. */
  height?: number;
  /** Scale uniformly so the longest side is this long (metres). For flat things like a gamepad. */
  size?: number;
  /** Many Poly Haven files hold several variants side by side; keep root parts ending in `_<variant>`. */
  variant?: string;
  /** Keep only these exact root part names. */
  parts?: string[];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
};

export const modelUrl = (id: string) => `/assets/models/${id}/${id}_1k.gltf`;

function keepPart(name: string, variant?: string, parts?: string[]) {
  if (parts) return parts.includes(name);
  if (variant) return name.endsWith(`_${variant}`);
  return true;
}

const standardCache = new WeakMap<THREE.Material, THREE.Material>();

// glTF extensions (transmission, specular, ior, clearcoat) turn materials into
// MeshPhysicalMaterial: each combination is another heavy shader to compile, and
// transmission re-renders the whole scene every frame. At cabin scale the plain
// standard material looks the same, so convert once and share the result.
function toStandard(material: THREE.Material): THREE.Material {
  const physical = material as THREE.MeshPhysicalMaterial;
  if (!physical.isMeshPhysicalMaterial) return material;
  const cached = standardCache.get(material);
  if (cached) return cached;
  const standard = new THREE.MeshStandardMaterial();
  THREE.MeshStandardMaterial.prototype.copy.call(standard, physical);
  if (physical.transmission > 0) {
    // A lantern pane or camera lens: plain see-through glass.
    standard.transparent = true;
    standard.opacity = 0.35;
  }
  standardCache.set(material, standard);
  return standard;
}

// Loads a Poly Haven model, centres it on x/z, and stands it on `position.y`.
export function Model({ id, position, rotationY = 0, height, size: fitSize, variant, parts, onClick }: ModelProps) {
  const { scene } = useGLTF(modelUrl(id));
  const partsKey = parts?.join(",");
  const object = useMemo(() => {
    const clone = scene.clone(true);
    for (const child of [...clone.children]) {
      if (!keepPart(child.name, variant, parts)) clone.remove(child);
    }
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = toStandard(mesh.material as THREE.Material);
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = height ? height / size.y : fitSize ? fitSize / Math.max(size.x, size.y, size.z) : 1;
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    return wrapper;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, height, fitSize, variant, partsKey]);

  return <primitive object={object} position={position} rotation={[0, rotationY, 0]} onClick={onClick} />;
}
