import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DOORWAY, INSIDE_VIEWS, VIEWPOINTS, type ViewpointId } from "./viewpoints";

const DRAG_SENSITIVITY = 0.0042;
const PITCH_LIMIT = 1.15;
const LOOK_DAMPING = 9;
const MOVE_SECONDS = 1.7;
// Pointer travel (px) above which a press counts as a drag, not a click.
export const CLICK_SLOP = 6;

// Shared with clickable meshes so a drag that ends on an object doesn't "click" it.
export const pointerState = { travel: 0 };

function anglesToward(from: THREE.Vector3, to: THREE.Vector3) {
  const d = to.clone().sub(from);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}

// Pick the equivalent of `angle` closest to `reference`, so turns take the short way round.
function nearestAngle(angle: number, reference: number) {
  return angle + Math.round((reference - angle) / (Math.PI * 2)) * Math.PI * 2;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function LookControls({ view }: { view: ViewpointId }) {
  const { camera, gl, size } = useThree();
  const look = useRef({ yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 });
  const move = useRef<{ curve: THREE.CatmullRomCurve3; t: number } | null>(null);
  const previousView = useRef<ViewpointId | null>(null);

  // Wider lens in portrait so phones still see the room.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width < size.height ? 72 : 55;
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => {
    const vp = VIEWPOINTS[view];
    const end = new THREE.Vector3(...vp.position);
    const { yaw, pitch } = anglesToward(end, new THREE.Vector3(...vp.lookAt));
    const l = look.current;
    const from = previousView.current;
    previousView.current = view;

    if (from === null) {
      camera.position.copy(end);
      Object.assign(l, { yaw, pitch, targetYaw: yaw, targetPitch: pitch });
      return;
    }
    l.targetYaw = nearestAngle(yaw, l.yaw);
    l.targetPitch = pitch;
    const crossesDoor = INSIDE_VIEWS.includes(from) !== INSIDE_VIEWS.includes(view);
    const points = [camera.position.clone(), ...(crossesDoor ? [new THREE.Vector3(...DOORWAY)] : []), end];
    move.current = { curve: new THREE.CatmullRomCurve3(points), t: 0 };
  }, [view, camera]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    let active: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const down = (e: PointerEvent) => {
      if (active !== null) return;
      active = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      pointerState.travel = 0;
    };
    const moveHandler = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      pointerState.travel += Math.abs(dx) + Math.abs(dy);
      const l = look.current;
      l.targetYaw += dx * DRAG_SENSITIVITY;
      l.targetPitch = THREE.MathUtils.clamp(l.targetPitch + dy * DRAG_SENSITIVITY, -PITCH_LIMIT, PITCH_LIMIT);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId === active) active = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const l = look.current;
    const k = 1 - Math.exp(-dt * LOOK_DAMPING);
    l.yaw += (l.targetYaw - l.yaw) * k;
    l.pitch += (l.targetPitch - l.pitch) * k;
    camera.rotation.set(l.pitch, l.yaw, 0, "YXZ");

    const m = move.current;
    if (m) {
      m.t = Math.min(1, m.t + dt / MOVE_SECONDS);
      camera.position.copy(m.curve.getPoint(easeInOut(m.t)));
      if (m.t >= 1) move.current = null;
    }
  });

  return null;
}
