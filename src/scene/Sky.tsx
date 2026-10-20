import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { LiveLighting } from "./lighting";

const DOME_RADIUS = 180;
const STAR_RADIUS = 150;
const STAR_COUNT = 1200;

const domeVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const domeFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunStrength;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
    float d = max(dot(normalize(vDir), uSunDir), 0.0);
    col += uSunColor * (pow(d, 24.0) * 0.35 + pow(d, 900.0) * 3.0) * uSunStrength;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function SkyDome({ live }: { live: LiveLighting }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: domeVertex,
        fragmentShader: domeFragment,
        uniforms: {
          uTop: { value: live.skyTop },
          uHorizon: { value: live.skyHorizon },
          uSunDir: { value: new THREE.Vector3() },
          uSunColor: { value: live.sunColor },
          uSunStrength: { value: 1 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [live],
  );
  useFrame(() => {
    material.uniforms.uSunDir.value.copy(live.sunPosition).normalize();
    material.uniforms.uSunStrength.value = Math.min(1, live.sunIntensity / 2);
  });
  return (
    <mesh material={material} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[DOME_RADIUS, 32, 16]} />
    </mesh>
  );
}

function Stars({ live }: { live: LiveLighting }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = 0.15 + Math.random() * 0.85;
      const r = Math.sqrt(1 - y * y);
      positions.set([Math.cos(theta) * r * STAR_RADIUS, y * STAR_RADIUS, Math.sin(theta) * r * STAR_RADIUS], i * 3);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, []);
  const material = useMemo(
    () => new THREE.PointsMaterial({ color: "#eef2ff", size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false }),
    [],
  );
  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    material.opacity = live.starOpacity * (0.8 + 0.2 * Math.sin(clock.elapsedTime * 0.7));
    if (ref.current) ref.current.visible = live.starOpacity > 0.02;
  });
  return <points ref={ref} geometry={geometry} material={material} renderOrder={-99} />;
}

function Moon({ live }: { live: LiveLighting }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = live.starOpacity > 0.02;
  });
  return (
    <group ref={ref} position={[60, 85, -100]}>
      <mesh renderOrder={-98}>
        <sphereGeometry args={[4, 32, 16]} />
        <meshBasicMaterial color="#f3efe0" fog={false} />
      </mesh>
      <sprite scale={[26, 26, 1]} renderOrder={-98}>
        <spriteMaterial color="#9fb2ff" transparent opacity={0.16} depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

export function Sky({ live, mobile, stars = true }: { live: LiveLighting; mobile: boolean; stars?: boolean }) {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.FogExp2(live.fogColor.getHex(), live.fogDensity), [live]);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    fog.color.copy(live.fogColor);
    fog.density = live.fogDensity;
    scene.environmentIntensity = live.envIntensity;
    if (sun.current) {
      sun.current.intensity = live.sunIntensity;
      sun.current.color.copy(live.sunColor);
      sun.current.position.copy(live.sunPosition);
    }
    if (hemi.current) {
      hemi.current.intensity = live.envIntensity * 0.5;
      hemi.current.color.copy(live.skyTop);
    }
  });

  return (
    <>
      <SkyDome live={live} />
      {stars && <Stars live={live} />}
      <Moon live={live} />
      {/* Reflections/ambient from a simple generated sky over a jungle-green ground. */}
      <Environment frames={1} resolution={64}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#a9c7e0" side={THREE.BackSide} />
        </mesh>
        <mesh scale={50}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshBasicMaterial color="#304a2a" side={THREE.BackSide} />
        </mesh>
      </Environment>
      <hemisphereLight ref={hemi} args={["#cfe3c8", "#2a3a1f", 0.4]} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
    </>
  );
}
