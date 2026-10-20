import { useGLTF, useTexture } from "@react-three/drei";
import { modelUrl } from "./Model";

// Every asset the cabin needs, so they can all start downloading at once.
// (React 19 doesn't pre-render siblings of a suspended component, so without
// this the models would load one batch after another.)
export const MODEL_IDS = [
  "old_bed_frame", "barrel_stove", "Lantern_01", "Rockingchair_01", "dining_chair_02",
  "chess_set", "wooden_crate_01", "dirty_football", "Ukulele_01", "Camera_01", "gamepad",
  "hatchet", "binoculars", "vintage_flashlight", "rubber_boots",
  "fern_02", "pachira_aquatica_01", "calathea_orbifolia_01", "shrub_03", "anthurium_botany_01",
];

export const TEXTURE_SETS = ["wood_trunk_wall", "old_wood_floor", "wood_floor_deck", "roof_planks", "rustic_stone_wall", "forest_floor"];

export function preloadAssets(): void {
  for (const id of MODEL_IDS) useGLTF.preload(modelUrl(id));
  for (const name of TEXTURE_SETS) {
    useTexture.preload([`/assets/textures/${name}/diff.jpg`, `/assets/textures/${name}/nor.jpg`, `/assets/textures/${name}/rough.jpg`]);
  }
}
