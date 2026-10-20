import * as THREE from "three";
import { LIGHTING, type Phase } from "./timeOfDay";

const PHASE_BLEND_SECONDS = 1.6;

// Mutable, smoothly-blended copy of the current lighting so phase changes fade.
// Scene components read it every frame instead of re-rendering through React.
export type LiveLighting = {
  envIntensity: number;
  sunIntensity: number;
  fireIntensity: number;
  lanternIntensity: number;
  starOpacity: number;
  fogDensity: number;
  sunColor: THREE.Color;
  sunPosition: THREE.Vector3;
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  fogColor: THREE.Color;
  forestTint: THREE.Color;
};

export function createLiveLighting(phase: Phase): LiveLighting {
  const t = LIGHTING[phase];
  return {
    envIntensity: t.envIntensity,
    sunIntensity: t.sunIntensity,
    fireIntensity: t.fireIntensity,
    lanternIntensity: t.lanternIntensity,
    starOpacity: t.stars ? 1 : 0,
    fogDensity: t.fogDensity,
    sunColor: new THREE.Color(t.sunColor),
    sunPosition: new THREE.Vector3(...t.sunPosition),
    skyTop: new THREE.Color(t.skyTop),
    skyHorizon: new THREE.Color(t.skyHorizon),
    fogColor: new THREE.Color(t.fogColor),
    forestTint: new THREE.Color(t.forestTint),
  };
}

const scratch = new THREE.Color();
const scratchV = new THREE.Vector3();

export function blendLighting(live: LiveLighting, phase: Phase, dt: number): void {
  const t = LIGHTING[phase];
  const k = 1 - Math.exp(-dt * (3 / PHASE_BLEND_SECONDS));
  const num = (key: "envIntensity" | "sunIntensity" | "fireIntensity" | "lanternIntensity" | "fogDensity", target: number) => {
    live[key] += (target - live[key]) * k;
  };
  num("envIntensity", t.envIntensity);
  num("sunIntensity", t.sunIntensity);
  num("fireIntensity", t.fireIntensity);
  num("lanternIntensity", t.lanternIntensity);
  num("fogDensity", t.fogDensity);
  live.starOpacity += ((t.stars ? 1 : 0) - live.starOpacity) * k;
  live.sunColor.lerp(scratch.set(t.sunColor), k);
  live.skyTop.lerp(scratch.set(t.skyTop), k);
  live.skyHorizon.lerp(scratch.set(t.skyHorizon), k);
  live.fogColor.lerp(scratch.set(t.fogColor), k);
  live.forestTint.lerp(scratch.set(t.forestTint), k);
  live.sunPosition.lerp(scratchV.set(...t.sunPosition), k);
}
