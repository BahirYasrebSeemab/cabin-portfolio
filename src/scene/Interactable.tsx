import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { CLICK_SLOP, pointerState } from "./LookControls";

const FIREFLIES_PER_TARGET = 5;
const HOVER_GLOW = new THREE.Color("#ff9a40");
const HOVER_GLOW_INTENSITY = 0.22;

type InteractableProps = {
  label: string;
  /** Where the fireflies gather and the label floats. */
  anchor: [number, number, number];
  enabled: boolean;
  onSelect: () => void;
  children: ReactNode;
};

type Glowable = THREE.Mesh & { material: THREE.MeshStandardMaterial };

function glowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,220,1)");
  g.addColorStop(0.25, "rgba(230,255,140,0.8)");
  g.addColorStop(1, "rgba(200,255,100,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

let sharedGlow: THREE.Texture | null = null;

// A few fireflies drifting around the anchor: the scene's way of saying "you can touch this".
function Fireflies({ anchor, visible, excited }: { anchor: [number, number, number]; visible: boolean; excited: boolean }) {
  const seeds = useMemo(
    () => Array.from({ length: FIREFLIES_PER_TARGET }, () => ({ a: Math.random() * 10, b: Math.random() * 10, r: 0.25 + Math.random() * 0.3 })),
    [],
  );
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(FIREFLIES_PER_TARGET * 3), 3)),
    [],
  );
  const material = useMemo(() => {
    sharedGlow ??= glowTexture();
    return new THREE.PointsMaterial({
      map: sharedGlow,
      size: 0.09,
      color: "#f4ffb0",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
  }, []);
  const fade = useRef(0);

  useFrame(({ clock }, dt) => {
    fade.current += ((visible ? 1 : 0) - fade.current) * (1 - Math.exp(-dt * 3));
    const t = clock.elapsedTime;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const spread = excited ? 0.6 : 1;
    seeds.forEach((s, i) => {
      pos.setXYZ(
        i,
        anchor[0] + Math.sin(t * 0.6 + s.a) * s.r * spread,
        anchor[1] + Math.sin(t * 0.9 + s.b) * 0.18 * spread,
        anchor[2] + Math.cos(t * 0.5 + s.a * 1.3) * s.r * spread,
      );
    });
    pos.needsUpdate = true;
    // Each firefly pulses on its own rhythm; average it into the opacity.
    material.opacity = fade.current * (0.55 + 0.45 * Math.sin(t * 2.3)) * (excited ? 1.4 : 1);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export function Interactable({ label, anchor, enabled, onSelect, children }: InteractableProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const glowables = useRef<Glowable[]>([]);

  // Give each mesh its own material copy so the hover glow doesn't light up shared materials elsewhere.
  useEffect(() => {
    const found: Glowable[] = [];
    group.current?.traverse((o) => {
      const mesh = o as Glowable;
      if (mesh.isMesh && mesh.material && "emissive" in mesh.material) {
        mesh.material = mesh.material.clone();
        found.push(mesh);
      }
    });
    glowables.current = found;
  }, []);

  useEffect(() => {
    for (const mesh of glowables.current) {
      mesh.material.emissive.copy(hovered ? HOVER_GLOW : new THREE.Color(0, 0, 0));
      mesh.material.emissiveIntensity = hovered ? HOVER_GLOW_INTENSITY : 1;
    }
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);

  useEffect(() => {
    if (!enabled) setHovered(false);
  }, [enabled]);

  const handlers = enabled
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (e.pointerType === "mouse") setHovered(true);
        },
        onPointerOut: () => setHovered(false),
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (pointerState.travel < CLICK_SLOP) onSelect();
        },
      }
    : {};

  return (
    <group>
      <group ref={group} {...handlers}>
        {children}
      </group>
      <Fireflies anchor={anchor} visible={enabled} excited={hovered} />
      {enabled && hovered && (
        <Html position={anchor} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <span className="scribble-label">{label}</span>
        </Html>
      )}
    </group>
  );
}

// Invisible mesh that still catches pointer rays (for doorways and windows).
export function HitArea({ size, position, rotation }: { size: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
