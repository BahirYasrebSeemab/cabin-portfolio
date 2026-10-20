# 07 · Dev tools

Add these to the address bar while testing (they work on the live site too, but visitors never see them unless they type them).

| Add to the URL | What it does |
|---|---|
| `?view=desk` | Start at a viewpoint: `porch`, `chair`, `inside`, `desk`, `bed`, `window`, `hobbies` |
| `?time=night` | Force the time of day: `day`, `sunset`, `night` (normally it follows your time zone) |
| `?dev` | Show the time-of-day switch in the top-right corner |
| `?off=forest,plants` | Skip parts of the scene: `sky`, `forest`, `ground`, `plants`, `interior`, `stars` — handy on slow machines |
| `?rings=2` | Only draw the 2 nearest forest rings |
| `?snap` | Used by `scripts/snap.mjs` to grab screenshots |

Combine with `&`: `http://localhost:5174/?view=porch&time=night&dev`

## Screenshots without a browser

```bash
node scripts/snap.mjs shot.png 640x400 "http://localhost:5174/?view=hobbies&time=day&snap"
```

Uses Playwright's headless Chromium (`npx playwright install chromium-headless-shell`). It renders without a GPU, so it's slow; on a low-memory machine add `&off=forest,plants`.

## Check a baked forest image

`node scripts/inspect-edges.mjs trees-blur0.png` prints the average colour of leaf edges vs. solid leaves — if edges are much brighter, the trees will show white outlines at night.
