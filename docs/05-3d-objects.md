# 05 · 3D objects & hobbies

Adding an object takes three steps: **download it → list it → place it.** Optional fourth: make it clickable.

## Where things are (coordinates)

All sizes are in **metres**. Standing outside, facing the front door:

```
                 back wall  z = -3.8
        ┌───────────────────────────────┐
        │ HOBBY CORNER        BED       │
        │ (shelf, guitar,    (moose     │
 left   │  chess crate,       mount     │  right
 wall   │  camping gear)      above)    │  wall
 x=-2.2 │                     STOVE     │  x=+2.2
        │ WINDOW      RUG     MAP       │
        │ DESK+PC                       │
        └──────────[ DOOR ]─────────────┘
                 front wall  z = 0
           PORCH  (z = 0 … +2,  rocking chair at x=-1.5)
```

- **x**: left (−) / right (+)
- **y**: up. The cabin floor is at `FLOOR_Y` (0.4 m above the ground).
- **z**: front wall is `0`, the room goes toward **−z**, the porch toward **+z**.

All cabin sizes live in `src/scene/layout.ts`.

## 1 · Download a model

Free, high-quality, no-credit-needed (CC0) models: **https://polyhaven.com/models**. The name is the end of the URL (`polyhaven.com/a/Camera_01` → `Camera_01`).

```bash
python3 scripts/fetch-polyhaven.py --models Camera_01
```

It lands in `public/assets/models/Camera_01/`.

> **Models from elsewhere** (Sketchfab, etc.): export as **glTF** (`.gltf` + `.bin` + textures), put it in `public/assets/models/<name>/` and name the main file `<name>_1k.gltf`. Check the licence — CC-BY means you must credit the author (add a line to [10 · Roadmap](10-roadmap.md) → *Credits* until there's a credits page). Keep it under ~50k triangles and 1k textures, or phones will struggle.

## 2 · List it (so it loads in parallel)

Add the name to `MODEL_IDS` in **`src/scene/assets.ts`**. Without this it still works, but loads later and slower.

## 3 · Place it

Hobby things go in the `HobbyCorner` function in **`src/scene/Interior.tsx`**; everything else in the `Interior` function below it.

```tsx
<Model id="Camera_01" position={[-1.9, FLOOR_Y + 1.35, -3.3]} rotationY={Math.PI / 2} size={0.15} />
```

| Prop | What it does |
|---|---|
| `id` | the folder name from step 1 |
| `position` | `[x, y, z]` — where the bottom-centre of the object sits. Use `FLOOR_Y` for "on the floor" |
| `rotationY` | turn it, in radians: `Math.PI / 2` = 90°, `Math.PI` = 180° |
| `height` | scale so it's this tall (metres) |
| `size` | scale so its longest side is this long — better for flat things |
| `variant` | some files hold several versions (`fern_02` has `a`–`d`) — pick one |
| `parts` | keep only some named parts, e.g. `parts={["rubber_boots_l", "rubber_boots_r"]}` |

Save the file and look at the browser — it reloads instantly. Nudge numbers until it sits right. Tip: open `http://localhost:5174/?view=hobbies` to jump straight to the hobby corner (see [07 · Dev tools](07-dev-tools.md)).

## 4 · Make it clickable (optional)

Clickable things get fireflies, a warm glow on hover and a handwritten label. Example — the guitar opens a video:

**a)** In `src/scene/Interior.tsx`, add the name to `TargetId`:
```ts
export type TargetId = "door" | "porchChair" | "computer" | "bed" | "window" | "hobbies" | "chess" | "guitar";
```

**b)** Wrap the object in `Interactable` (the `anchor` is where the fireflies gather):
```tsx
<Interactable label={t.guitar.label} anchor={[-1.55, FLOOR_Y + 0.8, -3.5]} enabled={t.guitar.enabled} onSelect={() => onSelect("guitar")}>
  <Model id="Ukulele_01" position={[0, 0, 0]} height={1.05} />
</Interactable>
```
(Inside `HobbyCorner`, pass `t` and `onSelect` down the same way `chess` is.)

**c)** In `src/App.tsx`:
- add a label: `guitar: "Hear me play",` in `LABELS`
- say from which view it's clickable: add `"guitar"` to `ENABLED.hobbies`
- say what happens in `select`: `if (id === "guitar") window.open("https://youtube.com/…", "_blank", "noopener,noreferrer");`

## Moving the camera spots

Viewpoints (where you stand and what you look at) are in `src/scene/viewpoints.ts`: `position` is where your eyes are, `lookAt` is what you face when you arrive. Eye height: about `FLOOR_Y + 1.6` standing, `FLOOR_Y + 1.2` sitting.

## Lights

Lanterns: `<Lantern position={[x, y, z]} live={live} />` (from `decor.tsx`) — a lantern model with a warm light that gets brighter at night. Every light costs performance on phones; the cabin has 4 — try not to go past 6.
