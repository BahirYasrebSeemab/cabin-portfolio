import * as THREE from "three";

// BoxGeometry with UVs scaled by face size, so one shared material tiles at a
// constant real-world scale (`tile` metres per texture repeat) on every box.
// `swap` turns the texture 90° (e.g. vertical log texture → horizontal logs).
export function tiledBox(w: number, h: number, d: number, tile = 1, swap = false): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  // Face order: +x, -x, +y, -y, +z, -z — 4 vertices each.
  const faceSize: [number, number][] = [
    [d, h], [d, h], [w, d], [w, d], [w, h], [w, h],
  ];
  for (let face = 0; face < 6; face++) {
    const [su, sv] = faceSize[face];
    for (let i = 0; i < 4; i++) {
      const idx = face * 4 + i;
      const u = (uv.getX(idx) * su) / tile;
      const v = (uv.getY(idx) * sv) / tile;
      if (swap) uv.setXY(idx, v, u);
      else uv.setXY(idx, u, v);
    }
  }
  uv.needsUpdate = true;
  return geo;
}
