// Dev-only: reports average colour of a baked cell's leaf edges vs solid interior.
// node scripts/inspect-edges.mjs <path under assets/forest, e.g. trees-blur3.png>
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const target = process.argv[2] ?? "cells/cell-0.png";
const base = join(homedir(), ".cache/ms-playwright/chromium_headless_shell-1148");
const shell = join(base, readdirSync(base).find((d) => d.startsWith("chrome")), "headless_shell");
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(shell, ["--no-sandbox", `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 300 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 1; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const n = id++; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Page.navigate", { url: `http://localhost:5174/assets/forest/${target}` });
await sleep(3000);
const r = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => {
  const img = document.images[0]; const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0); const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const bins = { edge: [0,0,0,0], solid: [0,0,0,0], faint: [0,0,0,0] };
  for (let i = 0; i < d.length; i += 4) { const a = d[i+3] / 255; const k = a >= 0.99 ? 'solid' : a >= 0.45 ? 'edge' : a > 0.02 ? 'faint' : null; if (!k) continue;
    bins[k][0] += d[i]; bins[k][1] += d[i+1]; bins[k][2] += d[i+2]; bins[k][3]++; }
  return Object.fromEntries(Object.entries(bins).map(([k, v]) => [k, v[3] ? { rgb: v.slice(0,3).map(x => Math.round(x / v[3])), n: v[3] } : null]));
})()` });
console.log(JSON.stringify(r.result.result.value));
ws.close(); chrome.kill(); process.exit(0);
