import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";

declare global {
  interface Window {
    __frames?: number;
    __snap?: () => string;
    __ready?: boolean;
  }
}

// Mounted last inside the Suspense boundary: once it mounts, the whole scene has loaded.
export function ReadyFlag() {
  useEffect(() => {
    window.__ready = true;
  }, []);
  return null;
}

// Test-only: lets a headless browser grab a frame straight from WebGL.
export function SnapHook() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    window.__frames = 0;
    window.__snap = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    window.__frames = (window.__frames ?? 0) + 1;
  });
  return null;
}
