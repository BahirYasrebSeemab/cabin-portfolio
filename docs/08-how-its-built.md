# 08 · How it's built

**Stack:** React 19 + TypeScript, Three.js through React Three Fiber (`@react-three/fiber`) and its helpers (`@react-three/drei`), built with Vite, hosted on Vercel.

## Folder map

```
cabin/
├── src/
│   ├── content/          ← YOUR WORDS: profile, projects, skills, extras (+ types.ts)
│   ├── scene/            ← THE 3D WORLD
│   │   ├── layout.ts         cabin sizes, door/window positions
│   │   ├── viewpoints.ts     camera spots
│   │   ├── Cabin.tsx         walls, roof, porch, windows (wood textures)
│   │   ├── Interior.tsx      where every object stands + what's clickable
│   │   ├── furniture.tsx     desk, bookshelf + books, flute, bedroll (built from code)
│   │   ├── decor.tsx         map, moose mount, rug, bed, stove, lanterns
│   │   ├── Computer.tsx      monitor, keyboard, mouse
│   │   ├── Desktop.tsx       the computer screen (built from src/content)
│   │   ├── Interactable.tsx  fireflies, hover glow, labels
│   │   ├── Forest.tsx + forestConfig.ts   the layered jungle
│   │   ├── Ground.tsx        forest floor + real 3D plants near the cabin
│   │   ├── Sky.tsx           sky, sun/moon, stars, haze, lights
│   │   ├── timeOfDay.ts      colours/lights for day, sunset, night
│   │   ├── lighting.ts       smooth fades between times of day
│   │   ├── LookControls.tsx  drag-to-look + walking between spots
│   │   ├── Model.tsx         loads a 3D model and sizes it
│   │   └── assets.ts         list of models/textures to preload
│   ├── tools/            ← dev-only pages for baking the forest
│   ├── App.tsx           ← puts it all together: views, clicks, buttons
│   └── styles.css
├── public/assets/        ← models, textures, baked forest images
├── scripts/              ← content check, model download, forest bake, screenshots
└── docs/                 ← this guide
```

## How a visit works

1. `App.tsx` starts loading every model and texture at once (`assets.ts`), showing *"walking up to the cabin…"*.
2. The scene appears at the **porch** viewpoint. Time of day comes from the clock in `profile.json`'s time zone.
3. Dragging turns your head (`LookControls.tsx`). Clicking something with fireflies moves the camera to a new viewpoint, walking through the doorway when going in or out.
4. At the desk, the monitor shows a real web page (`Desktop.tsx`) placed on the 3D screen.

## Why some things are the way they are

- **Fixed viewpoints, not free walking** — works the same with a mouse or a thumb, and keeps the camera where the scene looks good.
- **Forest = baked pictures, not 3D trees** — real tree models are millions of triangles; flat pictures of them cost almost nothing.
- **Fancy glTF materials are simplified** (`Model.tsx`) — glass that refracts light makes the whole scene render twice every frame.
- **Everything preloads at once** — otherwise React loads models one after another and the wait doubles.
