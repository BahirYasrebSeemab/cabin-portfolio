# 06 · The forest

The jungle is an Amazon-style rainforest: very tall straight-trunked giants (40–55 m) with dark umbrella crowns and hanging lianas, açaí-style palms underneath, and dense undergrowth. It's made of **flat cut-out pictures** standing in rings around the cabin — inner rings sharp, outer rings blurrier and sinking into green haze. That keeps it light enough for phones.

## Change how the forest looks (no re-baking)

Everything is in **`src/scene/forestConfig.ts`** → `FOREST_RINGS`. Each ring:

| Field | Meaning |
|---|---|
| `radius` | distance from the cabin (m) |
| `spacing` | metres between trees — **smaller = denser** |
| `minH` / `maxH` | height range (m) of the tallest trees in the ring |
| `blur` | which pre-blurred image to use (`0`, `2`, `3`, `5`, `8`) |
| `layer` | `"trees"` (giants + palms + young trees) or `"undergrowth"` (bushes that fill the gaps) |

The mix inside a ring (how many giants vs palms vs young trees) and the palm/young-tree heights are in `src/scene/Forest.tsx` → `LAYER_MIX` and `buildRing`.

Colours per time of day (`forestTint`, `fogColor`, `fogDensity`, `skyHorizon`) are in `src/scene/timeOfDay.ts`. More fog = deeper, more mysterious jungle.

## Where the tree pictures come from

There are no free realistic Amazon tree models, so the trees are **assembled at bake time** from real scanned parts — the `bark_brown_02` texture, the pachira's leaf clusters (tinted to rainforest green), plus code-built palm fronds. The recipes are in **`src/tools/rainforestTrees.ts`**:

- `emergent` — the giants: tall bare trunk, buttress roots, branches only near the top, umbrella crown, lianas
- `canopy` — slightly shorter, rounder crown
- `palm` — thin curved trunk, feathery drooping fronds

Each entry in `IMPOSTORS` (in `forestConfig.ts`) is one picture: either one of those recipes with a `seed` (a different seed = a different-looking tree), or a plain Poly Haven model (`model` + `variant`). Max 8 entries — the atlas can't be wider than 4096 px on phones.

## Re-bake after changing trees

With `npm run dev` running:

```bash
npx playwright install chromium-headless-shell   # first time only
node scripts/bake-forest.mjs                     # all trees + atlases (~2 min)
node scripts/bake-forest.mjs 3                   # just tree #3 (then run without a number to rebuild the atlases)
```

Preview one tree at `http://localhost:5174/bake.html?cell=0`. Then check the scene and commit the new PNGs in `public/assets/forest/`.
