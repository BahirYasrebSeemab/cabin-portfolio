// Dev-only: stitches baked cells into one atlas, plus blurred copies for far rings.
import { FOREST_BLUR_LEVELS, forestCellUrl, IMPOSTOR_CELL, IMPOSTORS } from "../scene/forestConfig";

declare global {
  interface Window {
    __atlases?: { blur: number; dataUrl: string }[];
    __bakeError?: string;
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

// Blurred layers carry little detail, so they're stored at reduced resolution.
function blurred(source: HTMLCanvasElement, px: number) {
  const scale = px >= 5 ? 0.25 : 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `blur(${Math.max(1, px * scale)}px)`;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function assemble() {
  const atlas = document.createElement("canvas");
  atlas.width = IMPOSTOR_CELL.width * IMPOSTORS.length;
  atlas.height = IMPOSTOR_CELL.height;
  const ctx = atlas.getContext("2d")!;
  const cells = await Promise.all(IMPOSTORS.map((_, i) => loadImage(forestCellUrl(i))));
  cells.forEach((img, i) => ctx.drawImage(img, i * IMPOSTOR_CELL.width, 0));
  window.__atlases = FOREST_BLUR_LEVELS.map((blur) => ({ blur, dataUrl: (blur > 0 ? blurred(atlas, blur) : atlas).toDataURL("image/png") }));
}

assemble().catch((e: unknown) => {
  window.__bakeError = e instanceof Error ? e.message : String(e);
});
