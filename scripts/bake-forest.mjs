// Re-bakes the forest tree images. Needs the dev server running (npm run dev)
// (the trees are assembled from the pachira leaves + bark texture already in public/assets).
//
//   node scripts/bake-forest.mjs            bake every cell, then build the atlases
//   node scripts/bake-forest.mjs 3          re-bake only cell 3 (then run with no args to rebuild atlases)
//
// Each cell is rendered in a fresh headless browser so big trees fit in memory.
// Uses the Chromium that Playwright installs (npx playwright install chromium-headless-shell).
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5174";
const root = new URL("..", import.meta.url).pathname;
const outDir = join(root, "public/assets/forest");
const only = process.argv[2];

function findChrome() {
  const base = join(homedir(), ".cache/ms-playwright");
  const dir = readdirSync(base).filter((d) => d.startsWith("chromium_headless_shell")).sort().pop();
  if (!dir) throw new Error("No headless Chromium found. Run: npx playwright install chromium-headless-shell");
  const sub = readdirSync(join(base, dir)).find((d) => d.startsWith("chrome"));
  return join(base, dir, sub, "headless_shell");
}

const shell = findChrome();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readFromPage(url, expression, maxSeconds) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(shell, ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
    "--window-size=600,600", `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
  try {
    let targets;
    for (let i = 0; i < 600 && !targets; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); }
    }
    const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));
    let id = 1;
    const pending = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    });
    const send = (method, params = {}) => new Promise((r) => { const n = id++; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
    const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
    await send("Page.navigate", { url });
    const start = Date.now();
    while ((Date.now() - start) / 1000 < maxSeconds) {
      await sleep(3000);
      const err = await evalJs("window.__bakeError ?? null");
      if (err) throw new Error(err);
      const value = await evalJs(expression);
      if (value) { ws.close(); return value; }
    }
    throw new Error(`timed out waiting for ${url}`);
  } finally {
    chrome.kill();
  }
}

const savePng = (path, dataUrl) => writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));

const { IMPOSTORS } = await import(join(root, "src/scene/forestConfig.ts")).catch(() => ({ IMPOSTORS: null }));
const cellCount = IMPOSTORS?.length ?? Number(process.env.CELLS ?? 8);

mkdirSync(join(outDir, "cells"), { recursive: true });
const cells = only !== undefined ? [Number(only)] : [...Array(cellCount).keys()];
for (const i of cells) {
  const t = Date.now();
  savePng(join(outDir, "cells", `cell-${i}.png`), await readFromPage(`${BASE_URL}/bake.html?cell=${i}`, "window.__cell ?? null", 900));
  console.log(`cell ${i} baked in ${Math.round((Date.now() - t) / 1000)}s`);
}
if (only === undefined) {
  const atlases = await readFromPage(`${BASE_URL}/assemble.html`, "window.__atlases ?? null", 600);
  for (const a of atlases) {
    savePng(join(outDir, `trees-blur${a.blur}.png`), a.dataUrl);
    console.log(`saved trees-blur${a.blur}.png`);
  }
}
process.exit(0);
