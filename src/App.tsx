import { useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
import { profile } from "./content";
import { Cabin } from "./scene/Cabin";
import { Forest } from "./scene/Forest";
import { Ground } from "./scene/Ground";
import { Interior, type TargetId, type TargetState } from "./scene/Interior";
import { blendLighting, createLiveLighting, type LiveLighting } from "./scene/lighting";
import { LookControls, pointerState } from "./scene/LookControls";
import { Sky } from "./scene/Sky";
import { preloadAssets } from "./scene/assets";
import { ReadyFlag, SnapHook } from "./scene/SnapHook";
import { resolvePhase, type Phase, type TimeMode } from "./scene/timeOfDay";
import { INSIDE_VIEWS, VIEWPOINTS, type ViewpointId } from "./scene/viewpoints";


preloadAssets();

// What can be touched from each spot. Everything else rests (no fireflies).
const ENABLED: Record<ViewpointId, TargetId[]> = {
  porch: ["door", "porchChair"],
  chair: [],
  inside: ["door", "computer", "bed", "window", "hobbies"],
  desk: [],
  bed: ["computer", "window", "hobbies"],
  window: [],
  hobbies: ["chess"],
};

const LABELS: Record<TargetId, string> = {
  door: "Come in",
  porchChair: "Sit a while",
  computer: "My work",
  bed: "Rest here",
  window: "Look outside",
  hobbies: "Things I love",
  chess: "Play me on chess.com",
};

// Dev-only URL switches (see docs/07-dev-tools.md): ?view=desk  ?time=night  ?dev  ?off=forest,plants  ?snap
const params = new URLSearchParams(window.location.search);
const initialView = (params.get("view") as ViewpointId | null) ?? "porch";
const initialMode = (params.get("time") as TimeMode | null) ?? "live";
const off = new Set((params.get("off") ?? "").split(","));

function useIsMobile() {
  return useMemo(() => window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768, []);
}

function LightingBlender({ live, phase }: { live: LiveLighting; phase: Phase }) {
  useFrame((_, dt) => blendLighting(live, phase, Math.min(dt, 0.1)));
  return null;
}

function Loader() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="loader">
      <p>walking up to the cabin…</p>
      <div className="loader-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const mobile = useIsMobile();
  const [view, setView] = useState<ViewpointId>(VIEWPOINTS[initialView] ? initialView : "porch");
  const [mode, setMode] = useState<TimeMode>(initialMode);
  const [phase, setPhase] = useState<Phase>(() => resolvePhase(initialMode));
  const [hasDragged, setHasDragged] = useState(false);
  const live = useMemo(() => createLiveLighting(resolvePhase(initialMode)), []);

  useEffect(() => {
    setPhase(resolvePhase(mode));
    if (mode !== "live") return;
    const id = setInterval(() => setPhase(resolvePhase("live")), 60_000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    const onUp = () => {
      if (pointerState.travel > 40) setHasDragged(true);
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  const inside = INSIDE_VIEWS.includes(view);
  const targets = useMemo(() => {
    const enabled = ENABLED[view];
    const entries = (Object.keys(LABELS) as TargetId[]).map((id): [TargetId, TargetState] => [
      id,
      { enabled: enabled.includes(id), label: id === "door" && inside ? "Step outside" : LABELS[id] },
    ]);
    return Object.fromEntries(entries) as Record<TargetId, TargetState>;
  }, [view, inside]);

  const select = (id: TargetId) => {
    const next: Partial<Record<TargetId, ViewpointId>> = {
      door: inside ? "porch" : "inside",
      porchChair: "chair",
      computer: "desk",
      bed: "bed",
      window: "window",
      hobbies: "hobbies",
    };
    if (id === "chess") window.open(profile.chessCom, "_blank", "noopener,noreferrer");
    else if (next[id]) setView(next[id]);
  };

  const vp = VIEWPOINTS[view];

  return (
    <>
      <Canvas shadows dpr={[1, mobile ? 1.5 : 2]} camera={{ near: 0.05, far: 400, fov: 55 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <LightingBlender live={live} phase={phase} />
          {!off.has("sky") && <Sky live={live} mobile={mobile} stars={!off.has("stars")} />}
          {!off.has("forest") && <Forest live={live} />}
          {!off.has("ground") && <Ground plants={!off.has("plants")} />}
          <Cabin />
          {!off.has("interior") && <Interior live={live} targets={targets} onSelect={select} screenOn={inside} outside={!inside} />}
          <ReadyFlag />
        </Suspense>
        <LookControls view={view} />
        {params.has("snap") && <SnapHook />}
      </Canvas>

      <header className="nameplate">
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
      </header>

      {params.has("dev") && (
      <div className="time-switch" role="group" aria-label="Time of day (dev control)">
        {(["live", "day", "sunset", "night"] as TimeMode[]).map((m) => (
          <button key={m} className={m === mode ? "active" : ""} onClick={() => setMode(m)}>
            {m === "live" ? "Live · Dushanbe" : m}
          </button>
        ))}
      </div>
      )}

      <nav className="bottom-bar">
        {vp.back && (
          <button className="pill" onClick={() => setView(vp.back!)}>
            ← {vp.backLabel ?? "Back"}
          </button>
        )}
        {view !== "desk" && (
          <button className="pill pill-primary" onClick={() => setView("desk")}>
            Skip to computer
          </button>
        )}
      </nav>

      {!hasDragged && <p className="hint">Drag to look around · follow the fireflies</p>}
      <Loader />
    </>
  );
}
