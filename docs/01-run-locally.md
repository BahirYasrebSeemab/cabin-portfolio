# 01 · Run it locally

## One-time setup

1. Install **Node.js 20 or newer** (https://nodejs.org) — check with `node -v`.
2. In a terminal, go to the project folder and install the packages:

```bash
cd cabin
npm install
```

## Every time

```bash
npm run dev
```

Open **http://localhost:5174** in your browser. The page reloads by itself when you save a file.

On your phone (same Wi-Fi): Vite prints a `Network:` address like `http://192.168.x.x:5174` — open that on the phone.

> On WSL (Linux inside Windows) the phone address may not work. Test phones on the deployed Vercel link instead.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the site locally |
| `npm run check` | Check your content files for mistakes |
| `npm run build` | Check content, then build the real site into `dist/` |
| `npm run preview` | Serve the built `dist/` (to test the production version) |
| `npm run typecheck` | Check the TypeScript code for errors |
