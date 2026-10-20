// Dev-only: grabs one frame of the running scene through a headless browser.
// node scripts/snap.mjs <out.png> <width>x<height> <url> [maxSeconds]
// The page must be opened with ?snap so SnapHook exposes window.__snap / __ready.
import { spawn } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [out, size, url, maxSeconds = "300"] = process.argv.slice(2);
const [width, height] = size.split("x").map(Number);
const base = join(homedir(), ".cache/ms-playwright/chromium_headless_shell-1148");
const shell = join(base, readdirSync(base).find((d) => d.startsWith("chrome")), "headless_shell");
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(shell, ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
  "--hide-scrollbars", `--window-size=${width},${height}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 600 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 1;
const pending = new Map();
const logs = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") logs.push("EXCEPTION " + m.params.exceptionDetails.exception?.description);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") logs.push("ERROR " + m.params.args.map((a) => a.value ?? a.description).join(" "));
});
const send = (method, params = {}) => new Promise((r) => { const n = id++; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;

await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
await send("Page.navigate", { url });
const start = Date.now();
while ((Date.now() - start) / 1000 < Number(maxSeconds)) {
  await sleep(5000);
  const state = JSON.parse((await evalJs("JSON.stringify({frames: window.__frames ?? null, ready: !!window.__ready})")) ?? "{}");
  console.log(Math.round((Date.now() - start) / 1000) + "s", JSON.stringify(state), logs.splice(0).join(" | ").slice(0, 300));
  if (state.ready && state.frames > 5) break;
}
const data = await evalJs("window.__snap ? window.__snap() : null");
if (data) { writeFileSync(out, Buffer.from(data.split(",")[1], "base64")); console.log("saved", out); } else console.log("no snap");
ws.close();
chrome.kill();
process.exit(0);
