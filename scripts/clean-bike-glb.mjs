#!/usr/bin/env node
/**
 * One-off asset step for public/models/mountain-bike.glb (AERO3D, CC BY 4.0, via Sketchfab).
 *
 * The scan was captured standing on sand, and the sand is fused into the main mesh: there is no
 * node or material to filter by name at runtime. This script edits the geometry instead:
 *   1. fits circles to both tyres and levels the bike (the scan sits 3.1° nose-down),
 *   2. removes every triangle within a few cm of the sand height-field, except dark tread at the
 *      tyre contacts, plus the scan blob between the resting pedal and the sand,
 *   3. drops loose crumbs left near the ground,
 *   4. bakes seam-free smooth normals and drops KHR_materials_unlit so the bike can be lit,
 *   5. re-encodes with Draco (the app decodes with the JS decoder in public/draco/).
 *
 * Input is the Draco + JPEG conversion of the Sketchfab download (the mountain-bike.glb committed
 * before this script existed). Output replaces public/models/mountain-bike.glb.
 *
 * The tooling is not a project dependency. Run it from a scratch directory:
 *   npm i --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 \
 *     @gltf-transform/functions@4.5.1 draco3dgltf sharp
 *   node clean-bike-glb.mjs <input.glb> <output.glb>
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { dedup, prune } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node clean-bike-glb.mjs <input.glb> <output.glb>");
  process.exit(1);
}

// File space of this asset: X = bike length (front wheel at -X), Y = lateral, Z = up.
const SEEDS = [
  { cx: -4.27, cz: -7.27, r: 3.04 }, // front tyre, eyeballed from a side view
  { cx: 5.41, cz: -6.79, r: 3.09 }, // rear tyre
];
const SAND_BAND = 0.32; // file units above the sand surface (~3.5 cm) that count as sand
const DARK_TREAD = 0.36; // max texture brightness kept inside the tyre corridor at ground level
const PEDAL_MOUND = { x: [1.0, 2.15], y: [-0.95, 0.65], zBelow: -9.25 }; // file space, before levelling

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const document = await io.read(input);
const primitives = document
  .getRoot()
  .listNodes()
  .filter((node) => node.getMesh())
  .map((node) => ({ name: node.getName(), primitive: node.getMesh().listPrimitives()[0] }));

async function brightnessSampler(primitive) {
  const image = primitive.getMaterial()?.getBaseColorTexture()?.getImage();
  const { data, info } = await sharp(Buffer.from(image)).raw().removeAlpha().toBuffer({ resolveWithObject: true });
  return (u, v) => {
    const x = Math.min(info.width - 1, Math.max(0, Math.floor(u * info.width)));
    const y = Math.min(info.height - 1, Math.max(0, Math.floor(v * info.height)));
    const offset = (y * info.width + x) * 3;
    return Math.max(data[offset], data[offset + 1], data[offset + 2]) / 255;
  };
}

/** Algebraic (Kåsa) circle fit in the X–Z plane. */
function fitCircle(points) {
  let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0, sxxx = 0, szzz = 0, sxzz = 0, sxxz = 0;
  for (const [x, z] of points) {
    sx += x; sz += z; sxx += x * x; szz += z * z; sxz += x * z;
    sxxx += x * x * x; szzz += z * z * z; sxzz += x * z * z; sxxz += x * x * z;
  }
  const m = [
    [sxx, sxz, sx, -(sxxx + sxzz)],
    [sxz, szz, sz, -(sxxz + szzz)],
    [sx, sz, points.length, -(sxx + szz)],
  ];
  for (let i = 0; i < 3; i += 1) {
    let pivot = i;
    for (let r = i + 1; r < 3; r += 1) if (Math.abs(m[r][i]) > Math.abs(m[pivot][i])) pivot = r;
    [m[i], m[pivot]] = [m[pivot], m[i]];
    for (let r = 0; r < 3; r += 1) {
      if (r === i) continue;
      const f = m[r][i] / m[i][i];
      for (let c = i; c < 4; c += 1) m[r][c] -= f * m[i][c];
    }
  }
  const a = m[0][3] / m[0][0], b = m[1][3] / m[1][1], c = m[2][3] / m[2][2];
  const cx = -a / 2, cz = -b / 2;
  return { cx, cz, r: Math.sqrt(cx * cx + cz * cz - c) };
}

// ── 1. tyres: refine the seeds on dark vertices of the main scan ───────────────────────────────
const main = primitives.reduce((a, b) =>
  a.primitive.getAttribute("POSITION").getCount() >= b.primitive.getAttribute("POSITION").getCount() ? a : b,
);
const mainBright = await brightnessSampler(main.primitive);
const mainP = main.primitive.getAttribute("POSITION").getArray();
const mainU = main.primitive.getAttribute("TEXCOORD_0").getArray();
const wheels = SEEDS.map((seed) => {
  let fit = seed;
  let lateral = 0;
  for (let pass = 0; pass < 6; pass += 1) {
    const points = [];
    let ySum = 0;
    for (let i = 0; i < mainP.length / 3; i += 1) {
      if (mainBright(mainU[2 * i], mainU[2 * i + 1]) > 0.32) continue;
      const d = Math.hypot(mainP[3 * i] - fit.cx, mainP[3 * i + 2] - fit.cz);
      if (d > fit.r * 0.9 && d < fit.r * 1.06) {
        points.push([mainP[3 * i], mainP[3 * i + 2]]);
        ySum += mainP[3 * i + 1];
      }
    }
    fit = fitCircle(points);
    lateral = ySum / points.length;
  }
  return { ...fit, yc: lateral };
});
const [front, rear] = wheels;
const pitch = Math.atan2(rear.cz - front.cz, rear.cx - front.cx);
const cos = Math.cos(-pitch), sin = Math.sin(-pitch);
const level = (x, z) => [
  front.cx + (x - front.cx) * cos - (z - front.cz) * sin,
  front.cz + (x - front.cx) * sin + (z - front.cz) * cos,
];
for (const wheel of wheels) [wheel.cx, wheel.cz] = level(wheel.cx, wheel.cz);
const ground = Math.min(...wheels.map((w) => w.cz - w.r));
console.log(`tyres r=${front.r.toFixed(3)}/${rear.r.toFixed(3)}, pitch ${(pitch * 180 / Math.PI).toFixed(2)}°, ground z ${ground.toFixed(3)}`);

const inTyre = (x, y, z) =>
  wheels.some((w) => {
    const d = Math.hypot(x - w.cx, z - w.cz);
    return d > w.r - 0.55 && d < w.r + 0.12 && Math.abs(y - w.yc) < 0.55;
  });

// ── 2. sand height-field (35th percentile of low triangle centroids per 0.2-unit cell) ─────────
const CELL = 0.2, X0 = -8, Y0 = -3, GX = 90, GY = 40;
const heightField = new Float32Array(GX * GY).fill(Number.NaN);
{
  const P = mainP.slice();
  for (let i = 0; i < P.length / 3; i += 1) [P[3 * i], P[3 * i + 2]] = level(P[3 * i], P[3 * i + 2]);
  const I = main.primitive.getIndices().getArray();
  const buckets = Array.from({ length: GX * GY }, () => []);
  for (let t = 0; t < I.length / 3; t += 1) {
    let x = 0, y = 0, z = 0;
    for (let k = 0; k < 3; k += 1) { const i = I[3 * t + k]; x += P[3 * i] / 3; y += P[3 * i + 1] / 3; z += P[3 * i + 2] / 3; }
    if (z > ground + 1.2) continue;
    const gx = Math.floor((x - X0) / CELL), gy = Math.floor((y - Y0) / CELL);
    if (gx >= 0 && gy >= 0 && gx < GX && gy < GY) buckets[gy * GX + gx].push(z);
  }
  buckets.forEach((bucket, cell) => {
    if (bucket.length < 3) return;
    bucket.sort((a, b) => a - b);
    heightField[cell] = bucket[Math.floor(bucket.length * 0.35)];
  });
  for (let pass = 0; pass < 12; pass += 1) {
    const next = heightField.slice();
    for (let gy = 0; gy < GY; gy += 1)
      for (let gx = 0; gx < GX; gx += 1) {
        if (!Number.isNaN(heightField[gy * GX + gx])) continue;
        let sum = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = gx + dx, yy = gy + dy;
          if (xx < 0 || yy < 0 || xx >= GX || yy >= GY) continue;
          const v = heightField[yy * GX + xx];
          if (!Number.isNaN(v)) { sum += v; n += 1; }
        }
        if (n) next[gy * GX + gx] = sum / n;
      }
    heightField.set(next);
  }
  for (let cell = 0; cell < heightField.length; cell += 1) if (Number.isNaN(heightField[cell])) heightField[cell] = ground;
}
const sandAt = (x, y) => {
  const gx = Math.min(GX - 1, Math.max(0, Math.floor((x - X0) / CELL)));
  const gy = Math.min(GY - 1, Math.max(0, Math.floor((y - Y0) / CELL)));
  return heightField[gy * GX + gx];
};

// ── 3–4. per primitive: classify, drop crumbs, compact, bake normals ───────────────────────────
for (const { name, primitive } of primitives) {
  // Only these are compacted below; any other per-vertex attribute would keep the old count.
  const extra = primitive.listSemantics().filter((semantic) => !["POSITION", "TEXCOORD_0", "NORMAL"].includes(semantic));
  if (extra.length) throw new Error(`${name}: unexpected vertex attributes ${extra.join(", ")}; extend the compaction step`);
  const position = primitive.getAttribute("POSITION");
  const uv = primitive.getAttribute("TEXCOORD_0");
  const indices = primitive.getIndices();
  const original = position.getArray();
  const P = Float32Array.from(original);
  const U = uv.getArray();
  const I = indices.getArray();
  const vertexCount = P.length / 3, triangleCount = I.length / 3;
  for (let i = 0; i < vertexCount; i += 1) [P[3 * i], P[3 * i + 2]] = level(P[3 * i], P[3 * i + 2]);
  const bright = await brightnessSampler(primitive);

  const keep = new Uint8Array(triangleCount).fill(1);
  for (let t = 0; t < triangleCount; t += 1) {
    let x = 0, y = 0, z = 0, ox = 0, oy = 0, oz = 0, u = 0, v = 0, b = 0, topAboveSand = -Infinity;
    for (let k = 0; k < 3; k += 1) {
      const i = I[3 * t + k];
      x += P[3 * i] / 3; y += P[3 * i + 1] / 3; z += P[3 * i + 2] / 3;
      ox += original[3 * i] / 3; oy += original[3 * i + 1] / 3; oz += original[3 * i + 2] / 3;
      u += U[2 * i] / 3; v += U[2 * i + 1] / 3; b += bright(U[2 * i], U[2 * i + 1]);
      topAboveSand = Math.max(topAboveSand, P[3 * i + 2] - sandAt(P[3 * i], P[3 * i + 1]));
    }
    b = (b + 3 * bright(u, v)) / 6;
    const pedalMound =
      ox > PEDAL_MOUND.x[0] && ox < PEDAL_MOUND.x[1] && oy > PEDAL_MOUND.y[0] && oy < PEDAL_MOUND.y[1] && oz < PEDAL_MOUND.zBelow;
    const nearSand = z - sandAt(x, y) < SAND_BAND && topAboveSand < SAND_BAND + 0.15;
    const belowContact = z < ground - 0.02;
    if (pedalMound) keep[t] = 0;
    else if (nearSand || belowContact) keep[t] = inTyre(x, y, z) && b < DARK_TREAD && !belowContact ? 1 : 0;
  }

  // Weld by position so UV seams do not split components or crease normals.
  const weldIds = new Map();
  const weld = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i += 1) {
    const key = `${Math.round(P[3 * i] * 2000)},${Math.round(P[3 * i + 1] * 2000)},${Math.round(P[3 * i + 2] * 2000)}`;
    let id = weldIds.get(key);
    if (id === undefined) { id = weldIds.size; weldIds.set(key, id); }
    weld[i] = id;
  }
  const parent = Int32Array.from({ length: weldIds.size }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let t = 0; t < triangleCount; t += 1) {
    if (!keep[t]) continue;
    const a = find(weld[I[3 * t]]);
    for (let k = 1; k < 3; k += 1) { const b = find(weld[I[3 * t + k]]); if (a !== b) parent[b] = a; }
  }
  const components = new Map();
  for (let t = 0; t < triangleCount; t += 1) {
    if (!keep[t]) continue;
    const root = find(weld[I[3 * t]]);
    let c = components.get(root);
    if (!c) { c = { triangles: [], top: -Infinity }; components.set(root, c); }
    c.triangles.push(t);
    for (let k = 0; k < 3; k += 1) c.top = Math.max(c.top, P[3 * I[3 * t + k] + 2]);
  }
  for (const c of components.values()) {
    const crumb = (c.top - ground < 0.9 && c.triangles.length < 400) || c.triangles.length < 12;
    if (crumb) for (const t of c.triangles) keep[t] = 0;
  }

  const remap = new Int32Array(vertexCount).fill(-1);
  const nextIndices = [];
  let next = 0;
  for (let t = 0; t < triangleCount; t += 1) {
    if (!keep[t]) continue;
    for (let k = 0; k < 3; k += 1) {
      const i = I[3 * t + k];
      if (remap[i] < 0) remap[i] = next++;
      nextIndices.push(remap[i]);
    }
  }
  const NP = new Float32Array(next * 3), NU = new Float32Array(next * 2), NW = new Int32Array(next);
  for (let i = 0; i < vertexCount; i += 1) {
    const j = remap[i];
    if (j < 0) continue;
    NP.set(P.subarray(3 * i, 3 * i + 3), 3 * j);
    NU[2 * j] = U[2 * i]; NU[2 * j + 1] = U[2 * i + 1];
    NW[j] = weld[i];
  }
  position.setArray(NP);
  uv.setArray(NU);
  indices.setArray(next > 65535 ? Uint32Array.from(nextIndices) : Uint16Array.from(nextIndices));

  // Area-weighted face normals on welded vertices, then two neighbour-averaging passes.
  let accum = new Float32Array(weldIds.size * 3);
  for (let t = 0; t < nextIndices.length / 3; t += 1) {
    const [a, b, c] = [nextIndices[3 * t], nextIndices[3 * t + 1], nextIndices[3 * t + 2]];
    const e1 = [NP[3 * b] - NP[3 * a], NP[3 * b + 1] - NP[3 * a + 1], NP[3 * b + 2] - NP[3 * a + 2]];
    const e2 = [NP[3 * c] - NP[3 * a], NP[3 * c + 1] - NP[3 * a + 1], NP[3 * c + 2] - NP[3 * a + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const vtx of [a, b, c]) for (let k = 0; k < 3; k += 1) accum[3 * NW[vtx] + k] += n[k];
  }
  for (let pass = 0; pass < 2; pass += 1) {
    const smoothed = new Float32Array(accum.length);
    for (let t = 0; t < nextIndices.length / 3; t += 1) {
      const ids = [NW[nextIndices[3 * t]], NW[nextIndices[3 * t + 1]], NW[nextIndices[3 * t + 2]]];
      const sum = [0, 0, 0];
      for (const w of ids) {
        const length = Math.hypot(accum[3 * w], accum[3 * w + 1], accum[3 * w + 2]) || 1;
        for (let k = 0; k < 3; k += 1) sum[k] += accum[3 * w + k] / length;
      }
      for (const w of ids) for (let k = 0; k < 3; k += 1) smoothed[3 * w + k] += sum[k];
    }
    accum = smoothed;
  }
  const normals = new Float32Array(next * 3);
  for (let j = 0; j < next; j += 1) {
    const w = NW[j];
    const length = Math.hypot(accum[3 * w], accum[3 * w + 1], accum[3 * w + 2]) || 1;
    for (let k = 0; k < 3; k += 1) normals[3 * j + k] = accum[3 * w + k] / length;
  }
  primitive.setAttribute("NORMAL", document.createAccessor().setType("VEC3").setArray(normals).setBuffer(position.getBuffer()));
  console.log(`${name}: ${triangleCount} → ${nextIndices.length / 3} triangles`);
}

// ── 5. lit materials, Draco ────────────────────────────────────────────────────────────────────
for (const material of document.getRoot().listMaterials()) {
  material.setExtension("KHR_materials_unlit", null).setRoughnessFactor(0.72).setMetallicFactor(0);
}
for (const extension of document.getRoot().listExtensionsUsed()) {
  if (extension.extensionName === "KHR_materials_unlit") extension.dispose();
}
await document.transform(prune({ keepAttributes: true }), dedup()); // keepAttributes: prune would drop NORMAL
document
  .createExtension(KHRDracoMeshCompression)
  .setRequired(true)
  .setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 5,
    decodeSpeed: 5,
    quantizationBits: { POSITION: 14, NORMAL: 10, TEX_COORD: 12 },
  });
await io.write(output, document);
console.log(`wrote ${output}`);
