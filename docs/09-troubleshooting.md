# 09 · Troubleshooting

**The deploy failed with "Content check failed".**
The log lists each problem, e.g. `projects.json #3 (Spotlight): "links.live" must be a full https:// link`. Fix that field and push again. The live site is untouched until a build succeeds.

**"not valid JSON — Unexpected token…"**
Almost always a missing or extra comma, or a missing quote. Paste the file into https://jsonlint.com to find the line.

**My change doesn't show up on the live site.**
Check Vercel → Deployments: is the latest one *Ready*? Then hard-refresh the page (Ctrl+Shift+R / Cmd+Shift+R).

**The page is black or stuck on "walking up to the cabin…".**
Open the browser console (F12 → Console). A red "404" for a file in `/assets/` means a model or texture name is wrong — compare the `id` with the folder name in `public/assets/models/`.

**A new object is invisible.**
Usually wrong position (inside a wall or under the floor — y should be `FLOOR_Y` or higher) or wrong scale (try `height={1}`). Jump close with `?view=…`.

**It's slow on my phone.**
Try `?off=plants` — if that fixes it, there are too many plants near the cabin (`Ground.tsx`, the `scatter(34, …)` count). Fewer lanterns also help. The proper fix (compressed textures) is on the [roadmap](10-roadmap.md).

**`npm install` is very slow / times out.**
Retry with `npm install --prefer-offline --fetch-retries=6`.
