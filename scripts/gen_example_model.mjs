// Port of stair-tracer.html's geometry, used to (a) sanity-check the algorithm
// the user runs offline and (b) emit one example model so the import path works.
import fs from "node:fs";
import path from "node:path";

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1e-9)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distToPoly(x, y, pts) {
  let d = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) d = Math.min(d, distToSeg(x, y, pts[j][0], pts[j][1], pts[i][0], pts[i][1]));
  return d;
}
const SCENE_TILT = 45; // global camera angle (deg), mirrors the tracer
function partMesh(part) {
  const pts = part.pts, P = [], E = [];
  const push = (x, y, z) => (P.push([x, y, z]), P.length - 1);
  const th = SCENE_TILT * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th);
  const M = (px, py) => [px, -py * st + part.lift, -py * ct + part.depth];
  if (part.type === "ridge" && pts.length >= 2) {
    const h = part.wall, t = part.thickness; let prev = null;
    for (const [px, py] of pts) {
      const m = M(px, py);
      const fb = push(m[0], m[1], m[2]), ft = push(m[0], m[1] + h, m[2]), bb = push(m[0], m[1], m[2] + t), bt = push(m[0], m[1] + h, m[2] + t);
      E.push([fb, ft, "riser"], [bb, bt, "riser"], [fb, bb, "tread"], [ft, bt, "tread"]);
      if (prev) E.push([prev.fb, fb, "edge"], [prev.ft, ft, "nose"], [prev.bb, bb, "blob"], [prev.bt, bt, "blob"]);
      prev = { fb, ft, bb, bt };
    }
    return { P, E };
  }
  if (pts.length < 3) return { P, E };
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const bw = maxx - minx, bh = maxy - miny;
  const cell = Math.max(4, Math.max(bw, bh) / 20);
  const nx = Math.max(2, Math.ceil(bw / cell)), ny = Math.max(2, Math.ceil(bh / cell));
  const grid = []; let maxd = 0;
  for (let j = 0; j <= ny; j++) { grid[j] = []; for (let i = 0; i <= nx; i++) {
    const px = minx + (i / nx) * bw, py = miny + (j / ny) * bh;
    const inside = pointInPoly(px, py, pts), d = inside ? distToPoly(px, py, pts) : 0;
    if (d > maxd) maxd = d; grid[j][i] = { in: inside, d, px, py };
  } }
  maxd = maxd || 1; const amp = part.puffiness * maxd;
  const nrm = [0, -ct, st];
  const top = [], bot = [];
  for (let j = 0; j <= ny; j++) { top[j] = []; bot[j] = []; for (let i = 0; i <= nx; i++) { top[j][i] = -1; bot[j][i] = -1; } }
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const g = grid[j][i]; if (!g.in) continue;
    const dn = g.d / maxd, hn = amp * Math.sqrt(Math.max(0, 1 - (1 - dn) * (1 - dn)));
    const m = M(g.px, g.py);
    top[j][i] = push(m[0]+hn*nrm[0], m[1]+hn*nrm[1], m[2]+hn*nrm[2]);
    bot[j][i] = push(m[0]-hn*nrm[0], m[1]-hn*nrm[1], m[2]-hn*nrm[2]);
  }
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    if (top[j][i] < 0) continue;
    const rN = i < nx && top[j][i + 1] >= 0, dN = j < ny && top[j + 1] && top[j + 1][i] >= 0;
    if (rN) E.push([top[j][i], top[j][i + 1], "blob"], [bot[j][i], bot[j][i + 1], "blob"]);
    if (dN) E.push([top[j][i], top[j + 1][i], "blob"], [bot[j][i], bot[j + 1][i], "blob"]);
    const rim = !(i < nx) || !(j < ny) || i === 0 || j === 0 || top[j][i + 1] < 0 || top[j][i - 1] < 0 || (top[j + 1] && top[j + 1][i] < 0) || (top[j - 1] && top[j - 1][i] < 0);
    if (rim) E.push([top[j][i], bot[j][i], "edge"]);
  }
  for (let k = 0; k < pts.length; k++) {
    const a = push(...M(pts[k][0], pts[k][1])), b = push(...M(pts[(k + 1) % pts.length][0], pts[(k + 1) % pts.length][1]));
    E.push([a, b, "edge"]);
  }
  return { P, E };
}
function buildMesh(parts) {
  const points = [], edges = [];
  for (const part of parts) { const m = partMesh(part); const off = points.length; for (const p of m.P) points.push(p); for (const e of m.E) edges.push([e[0] + off, e[1] + off, e[2]]); }
  return { points, edges };
}

// An irregular flight: rounded boulders forming the front kerb of each step,
// each one set higher (lift) and further back (depth) than the last.
const blob = (cx, cy, r, jig, seed) => {
  let s = seed; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff, s / 0x7fffffff);
  const pts = []; const n = 9;
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; const rr = r * (1 - jig + jig * 2 * rnd()); pts.push([cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr]); }
  return pts;
};
const parts = [];
for (let i = 0; i < 4; i++) {
  parts.push({ type: "boulder", pts: blob(300, 360 - i * 18, 70 - i * 4, 0.28, 7 + i * 13), puffiness: 0.7, depth: i * 70, lift: i * 60, thickness: 60, wall: 70 });
}
const mesh = buildMesh(parts);
const round = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10, Math.round(p[2] * 10) / 10];
const out = { photo: "IMG_6619", caption: "Example model — replace with your own from the tracer tool.", category: "staircase", points: mesh.points.map(round), edges: mesh.edges };

const finite = mesh.points.every((p) => p.every(Number.isFinite));
const valid = mesh.edges.every((e) => e[0] >= 0 && e[1] >= 0 && e[0] < mesh.points.length && e[1] < mesh.points.length);
console.log(`points=${mesh.points.length} edges=${mesh.edges.length} finite=${finite} validEdges=${valid}`);

const dir = path.join(process.cwd(), "app", "(mywebsite)", "inca", "data", "models");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "example-IMG_6619.json"), JSON.stringify(out));
console.log("wrote example-IMG_6619.json");
