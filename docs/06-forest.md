# 06 · The forest

The jungle is made of **flat cut-out pictures of real 3D trees**, standing in rings around the cabin. Inner rings are sharp; outer rings are blurrier and sink into green haze. This is light enough for phones while still looking real.

## Change how the forest looks (no re-baking)

Everything is in **`src/scene/forestConfig.ts`** → `FOREST_RINGS`. Each ring:

| Field | Meaning |
|---|---|
| `radius` | distance from the cabin (m) |
| `spacing` | metres between trees — **smaller = denser** |
| `minH` / `maxH` | tree height range (m) |
| `blur` | which pre-blurred image to use (`0`, `2`, `3`, `5`, `8`) |
| `layer` | `"trees"` (mostly big trees) or `"undergrowth"` (bushes that hide trunks) |

Colours per time of day (`forestTint`, `fogColor`, `fogDensity`) are in `src/scene/timeOfDay.ts`. More fog = blurrier, more mysterious jungle.

## Change which trees are used (needs re-baking)

The pictures are rendered once from real models and saved as images in `public/assets/forest/`. To change them:

1. Download the big source trees (only needed once — they're too big for git):
   ```bash
   python3 scripts/fetch-polyhaven.py --bake-sources
   ```
2. Edit `IMPOSTORS` in `src/scene/forestConfig.ts` — each entry is one picture: which model, which `variant`, turned by `angle`, and its `kind` (`tree`, `mid`, `bush`). Any new model must be downloaded first (see [05](05-3d-objects.md)).
3. With `npm run dev` running, bake:
   ```bash
   npx playwright install chromium-headless-shell   # first time only
   node scripts/bake-forest.mjs
   ```
   This renders each tree (a few minutes) and writes `public/assets/forest/trees-blur*.png`.
4. Check it in the browser, then commit the new PNGs.

Tip: preview one baked tree at `http://localhost:5174/bake.html?cell=0` (the picture appears once it finishes).
