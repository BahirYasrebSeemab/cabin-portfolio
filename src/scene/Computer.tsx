import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { Desktop } from "./Desktop";

const SCREEN_W = 0.62;
const SCREEN_H = 0.38;
const SCREEN_PX_W = 1240;
const SCREEN_PX_H = Math.round((SCREEN_PX_W * SCREEN_H) / SCREEN_W);
// drei's transform mode maps 1 CSS px to distanceFactor / 400 world units.
const DISTANCE_FACTOR = (SCREEN_W / SCREEN_PX_W) * 400;

const KEY_ROWS = [14, 14, 13, 12, 11];
const KEY = 0.0235;
const KEY_GAP = 0.004;

// Low-profile keyboard: aluminium-grey base with instanced keycaps and a space bar.
function Keyboard() {
  const keys = useMemo(() => {
    const geo = new THREE.BoxGeometry(KEY, 0.007, KEY);
    const mat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.55 });
    const total = KEY_ROWS.reduce((a, b) => a + b, 0);
    const mesh = new THREE.InstancedMesh(geo, mat, total);
    const m = new THREE.Matrix4();
    let i = 0;
    KEY_ROWS.forEach((count, row) => {
      const rowWidth = count * (KEY + KEY_GAP);
      for (let k = 0; k < count; k++) {
        m.makeTranslation(-rowWidth / 2 + (KEY + KEY_GAP) * (k + 0.5), 0.012, -0.055 + row * (KEY + KEY_GAP));
        mesh.setMatrixAt(i++, m);
      }
    });
    mesh.castShadow = true;
    return mesh;
  }, []);
  return (
    <group>
      <mesh position={[0, 0.005, 0.012]} castShadow receiveShadow>
        <boxGeometry args={[0.39, 0.012, 0.15]} />
        <meshStandardMaterial color="#b9bcc0" metalness={0.6} roughness={0.35} />
      </mesh>
      <primitive object={keys} />
      <mesh position={[0, 0.012, -0.055 + 5 * (KEY + KEY_GAP)]} castShadow>
        <boxGeometry args={[0.13, 0.007, KEY]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.55} />
      </mesh>
    </group>
  );
}

function Mouse() {
  return (
    <mesh position={[0, 0.014, 0]} scale={[0.032, 0.016, 0.055]} castShadow>
      <sphereGeometry args={[1, 24, 12]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
    </mesh>
  );
}

/** `position` is the centre of the desk top; the screen faces -z (toward the chair). */
export function Computer({ screenOn, position }: { screenOn: boolean; position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <group position={[0, 0, -0.12]}>
        <mesh position={[0, 0.006, 0.02]} castShadow>
          <boxGeometry args={[0.22, 0.012, 0.16]} />
          <meshStandardMaterial color="#1b1b1b" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, 0.02]} castShadow>
          <boxGeometry args={[0.04, 0.26, 0.03]} />
          <meshStandardMaterial color="#1b1b1b" roughness={0.5} metalness={0.4} />
        </mesh>
        <group position={[0, 0.12 + SCREEN_H / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[SCREEN_W + 0.03, SCREEN_H + 0.03, 0.025]} />
            <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.0135]}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial color="#0f2a1b" toneMapped={false} />
          </mesh>
          {screenOn && (
            <Html transform distanceFactor={DISTANCE_FACTOR} position={[0, 0, 0.014]} zIndexRange={[10, 0]}>
              <Desktop width={SCREEN_PX_W} height={SCREEN_PX_H} />
            </Html>
          )}
        </group>
      </group>
      <group position={[0, 0, 0.13]}>
        <Keyboard />
      </group>
      <group position={[0.29, 0, 0.13]}>
        <Mouse />
      </group>
    </group>
  );
}
