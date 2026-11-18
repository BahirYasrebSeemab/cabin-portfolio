// The jungle around the cabin: rings of flat cut-out cards showing real plant
// models pre-rendered by bake.html. Inner rings are sharp; outer rings use
// pre-blurred images, blend, and sink into the fog.

export type ImpostorKind = "tree" | "palm" | "mid" | "bush";

export type Impostor = {
  kind: ImpostorKind;
  /** A Poly Haven model to render as-is… */
  model?: string;
  /** …with this root-part suffix ("" keeps everything)… */
  variant?: string;
  /** …or a tall Amazon-style tree assembled from real parts (src/tools/rainforestTrees.ts). */
  procedural?: "emergent" | "canopy" | "palm";
  seed?: number;
};

// Max 8 cells: 8 × 512px = a 4096px atlas, the largest texture all phones accept.
export const IMPOSTORS: Impostor[] = [
  { kind: "tree", procedural: "emergent", seed: 11 },
  { kind: "tree", procedural: "emergent", seed: 29 },
  { kind: "tree", procedural: "canopy", seed: 47 },
  { kind: "palm", procedural: "palm", seed: 5 },
  { kind: "palm", procedural: "palm", seed: 83 },
  { kind: "mid", model: "pachira_aquatica_01", variant: "d" },
  { kind: "bush", model: "fern_02", variant: "a" },
  { kind: "bush", model: "calathea_orbifolia_01", variant: "b" },
];

export const IMPOSTOR_CELL = { width: 512, height: 1024 };
export const IMPOSTOR_ASPECT = IMPOSTOR_CELL.width / IMPOSTOR_CELL.height;

export type Ring = {
  radius: number;
  jitter: number;
  /** Metres of circumference per card; smaller = denser. */
  spacing: number;
  minH: number;
  maxH: number;
  blur: number;
  /** Tree rings mix trees with mid-height plants; undergrowth rings hide trunks and gaps. */
  layer: "trees" | "undergrowth";
};

export const FOREST_RINGS: Ring[] = [
  { radius: 11.5, jitter: 1, spacing: 1.8, minH: 3, maxH: 6, blur: 0, layer: "undergrowth" },
  { radius: 13.5, jitter: 1.5, spacing: 3.2, minH: 34, maxH: 48, blur: 0, layer: "trees" },
  { radius: 17.5, jitter: 2, spacing: 3.4, minH: 34, maxH: 48, blur: 0, layer: "trees" },
  { radius: 21, jitter: 1.5, spacing: 2.0, minH: 4, maxH: 8, blur: 2, layer: "undergrowth" },
  { radius: 24, jitter: 2.5, spacing: 3.6, minH: 36, maxH: 50, blur: 2, layer: "trees" },
  { radius: 28, jitter: 2, spacing: 2.4, minH: 5, maxH: 10, blur: 3, layer: "undergrowth" },
  { radius: 32, jitter: 3, spacing: 4.0, minH: 36, maxH: 50, blur: 3, layer: "trees" },
  { radius: 44, jitter: 4, spacing: 4.6, minH: 38, maxH: 52, blur: 5, layer: "trees" },
  { radius: 62, jitter: 5, spacing: 5.4, minH: 40, maxH: 55, blur: 8, layer: "trees" },
];

export const FOREST_BLUR_LEVELS = [...new Set(FOREST_RINGS.map((r) => r.blur))];

/** Pre-baked atlas for a blur level (made by bake.html + assemble.html, see README). */
export const forestAtlasUrl = (blur: number) => `/assets/forest/trees-blur${blur}.png`;
export const forestCellUrl = (index: number) => `/assets/forest/cells/cell-${index}.png`;
