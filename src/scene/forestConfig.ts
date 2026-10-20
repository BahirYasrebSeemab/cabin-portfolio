// The jungle around the cabin: rings of flat cut-out cards showing real plant
// models pre-rendered by bake.html. Inner rings are sharp; outer rings use
// pre-blurred images, blend, and sink into the fog.

export type ImpostorKind = "tree" | "mid" | "bush";

export type Impostor = {
  model: string;
  /** Root-part suffix for files that pack several plants ("" keeps everything). */
  variant: string;
  /** Turn the model before rendering, to get a second distinct look from one tree. */
  angle: number;
  kind: ImpostorKind;
};

export const IMPOSTORS: Impostor[] = [
  { model: "island_tree_02", variant: "", angle: 0, kind: "tree" },
  { model: "island_tree_02", variant: "", angle: Math.PI / 2, kind: "tree" },
  { model: "island_tree_01", variant: "", angle: 0, kind: "tree" },
  { model: "island_tree_01", variant: "", angle: Math.PI / 2, kind: "tree" },
  { model: "pachira_aquatica_01", variant: "a", angle: 0, kind: "mid" },
  { model: "pachira_aquatica_01", variant: "d", angle: 0, kind: "mid" },
  { model: "fern_02", variant: "a", angle: 0, kind: "bush" },
  { model: "calathea_orbifolia_01", variant: "b", angle: 0, kind: "bush" },
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
  { radius: 11.5, jitter: 1, spacing: 2.2, minH: 2.5, maxH: 4.5, blur: 0, layer: "undergrowth" },
  { radius: 13, jitter: 1.5, spacing: 2.8, minH: 9, maxH: 14, blur: 0, layer: "trees" },
  { radius: 17, jitter: 2, spacing: 3.0, minH: 10, maxH: 16, blur: 0, layer: "trees" },
  { radius: 21, jitter: 1.5, spacing: 2.6, minH: 3, maxH: 5.5, blur: 2, layer: "undergrowth" },
  { radius: 23, jitter: 2.5, spacing: 3.4, minH: 11, maxH: 18, blur: 2, layer: "trees" },
  { radius: 31, jitter: 3, spacing: 3.8, minH: 12, maxH: 20, blur: 3, layer: "trees" },
  { radius: 43, jitter: 4, spacing: 4.4, minH: 13, maxH: 23, blur: 5, layer: "trees" },
  { radius: 60, jitter: 5, spacing: 5.2, minH: 15, maxH: 27, blur: 8, layer: "trees" },
];

export const FOREST_BLUR_LEVELS = [...new Set(FOREST_RINGS.map((r) => r.blur))];

/** Pre-baked atlas for a blur level (made by bake.html + assemble.html, see README). */
export const forestAtlasUrl = (blur: number) => `/assets/forest/trees-blur${blur}.png`;
export const forestCellUrl = (index: number) => `/assets/forest/cells/cell-${index}.png`;
