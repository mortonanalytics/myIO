// pointcloud: one map-first viewer for a walk, as the myDAR app's Results
// screen: a 2D/3D switch on one canvas; layer chips (LiDAR, Camera, Classes,
// Ortho) that toggle independently; points colored by photo color, class,
// height or sigma; in 3D the orthophoto draped on the DEM and, when the walk
// has one, a Points / Mesh switch; the track with its uncertainty band; a
// profile line; the accuracy card; in 2D a Select tool whose rectangle is
// sent to linked charts (linkCharts) as the points' keys; and, when the walk
// has a track, the app's "along the walk" slider (options.slider = false
// hides it).
//
// The points arrive packed (see R/pointcloud.R, pointcloud_payload()):
// positions as interleaved Uint16 x, y, z scaled to options.bbox, colors as
// Uint8 r, g, b, class codes as Uint8, and sigma as Uint8 on a log scale
// (byte = (log10(sigma_m) + 3) / 4 * 255), source as Uint8 (0 LiDAR, 1
// camera). Each array is base64. options.terrain carries the DEM as a grid
// (Float32 heights, NaN where empty) and options.mesh the mesh (Float32
// positions, Uint8 colors, Uint32 triangle indices).
//
// regl is imported lazily, as the other WebGL renderers do, so loading the
// engine's ES modules directly (no bundler) does not need it resolved.
import { b64ToBytes } from "../utils/b64-to-bytes.js";

export const COLOR_MODES = ["rgb", "class", "height", "sigma"];
// 2D sits on the page theme's chart background (--chart-bg); 3D on the
// myDAR app's dark scene background.
const BACKGROUND = [0.969, 0.973, 0.98, 1];
export const BACKGROUND_3D = [0.078, 0.071, 0.118, 1];

function themeBackground(node) {
  const value = node ? getComputedStyle(node).getPropertyValue("--chart-bg").trim() : "";
  const c = value ? d3.rgb(value) : null;
  return c && Number.isFinite(c.r) ? [c.r / 255, c.g / 255, c.b / 255, 1] : BACKGROUND;
}

// The 2D scale bar's ink: whichever of dark or light has the higher WCAG
// contrast against the plan background, which follows --chart-bg.
const SCALE_INK_DARK = "#1d2430", SCALE_INK_LIGHT = "#f3f4f6";
function luminance(rgb) {
  const f = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
}
function hexLuminance(hex) {
  const c = d3.rgb(hex);
  return luminance([c.r / 255, c.g / 255, c.b / 255]);
}
export function scaleInk(bg) {
  const l = luminance(bg) + 0.05;
  return l / (hexLuminance(SCALE_INK_DARK) + 0.05) >= (hexLuminance(SCALE_INK_LIGHT) + 0.05) / l ? SCALE_INK_DARK : SCALE_INK_LIGHT;
}
// Points are drawn at least this wide in meters, so surfaces close up.
const POINT_WORLD_SIZE = 0.025;

// ---- small column-major mat4 helpers --------------------------------------

export function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

export function orthographic(halfW, halfH, near, far) {
  const nf = 1 / (near - far);
  return [1 / halfW, 0, 0, 0, 0, 1 / halfH, 0, 0, 0, 0, 2 * nf, 0, 0, 0, (far + near) * nf, 1];
}

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

export function lookAt(eye, target, up) {
  const z = norm(sub(eye, target)), x = norm(cross(up, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}

// ---- payload --------------------------------------------------------------

function quantile(sorted, q) { return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))]; }

export function decodeCloud(options) {
  const n = options.n | 0;
  const bytes = (b64) => (b64 ? b64ToBytes(b64) : null);
  const posBytes = bytes(options.positions);
  const positions = new Uint16Array(posBytes.buffer, posBytes.byteOffset, n * 3);
  const rgb = bytes(options.rgb);
  const cls = bytes(options.cls);
  const sigma = bytes(options.sigma);
  const src = bytes(options.src);
  const bbox = options.bbox; // [xmin, xmax, ymin, ymax, zmin, zmax]
  // Height and sigma color ramps run between the 2nd and 98th percentiles.
  const sample = (get) => {
    const step = Math.max(1, Math.floor(n / 20000)), vals = [];
    for (let i = 0; i < n; i += step) vals.push(get(i));
    vals.sort((a, b) => a - b);
    return vals.length ? [quantile(vals, 0.02), quantile(vals, 0.98)] : [0, 1];
  };
  const zRange = sample((i) => positions[i * 3 + 2] / 65535);
  const sigmaRange = sigma ? sample((i) => sigma[i] / 255) : [0, 1];
  const classes = cls ? Array.from(new Set(cls)).sort((a, b) => a - b) : [];
  // The box holding the middle 98% of points on each axis, so a few stray
  // points do not shrink the first view.
  const axisRange = (k) => {
    const step = Math.max(1, Math.floor(n / 20000)), vals = [];
    for (let i = 0; i < n; i += step) vals.push(positions[i * 3 + k] / 65535);
    vals.sort((a, b) => a - b);
    const lo = bbox[k * 2], span = bbox[k * 2 + 1] - lo;
    return vals.length ? [lo + quantile(vals, 0.01) * span, lo + quantile(vals, 0.99) * span] : [lo, lo + span];
  };
  const box = [].concat(axisRange(0), axisRange(1), axisRange(2));
  // About 3,000 points in world coordinates, for fitting the first view.
  const fitPoints = [], every = Math.max(1, Math.floor(n / 3000));
  for (let i = 0; i < n; i += every) {
    fitPoints.push([bbox[0] + positions[i * 3] / 65535 * (bbox[1] - bbox[0]),
      bbox[2] + positions[i * 3 + 1] / 65535 * (bbox[3] - bbox[2]),
      bbox[4] + positions[i * 3 + 2] / 65535 * (bbox[5] - bbox[4])]);
  }
  let cameraPoints = 0;
  if (src) for (let i = 0; i < n; i++) cameraPoints += src[i] === 1 ? 1 : 0;
  return { n, positions, rgb, cls, sigma, src, cameraPoints, bbox, box, fitPoints, zRange, sigmaRange, classes };
}

export function sigmaFromByte(b) { return Math.pow(10, b / 255 * 4 - 3); }

function typed(b64, Type) {
  const bytes = b64ToBytes(b64);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Type(copy.buffer);
}

// The DEM grid: { cols, rows, x0, y0, dx, dy, z } with z base64 Float32 in
// row-major order from (x0, y0) (cell centers, y increasing). Returns the
// heights and a nearest-cell lookup that gives NaN off the grid or in a gap.
export function decodeTerrain(terrain) {
  if (!terrain || !terrain.z) return null;
  const z = typed(terrain.z, Float32Array);
  const { cols, rows, x0, y0, dx, dy } = terrain;
  const at = (x, y) => {
    const c = Math.round((x - x0) / dx), r = Math.round((y - y0) / dy);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return NaN;
    return z[r * cols + c];
  };
  return { cols, rows, x0, y0, dx, dy, z, at };
}

// Triangles of the DEM surface (two per grid square whose four corners all
// have a height) with texture coordinates over the orthophoto extent
// [xmin, xmax, ymin, ymax]. Non-indexed, so no 32-bit index extension.
export function buildDrape(grid, extent) {
  const { cols, rows, x0, y0, dx, dy, z } = grid;
  const pos = [], uv = [];
  const u = (x) => (x - extent[0]) / (extent[1] - extent[0]);
  const v = (y) => (y - extent[2]) / (extent[3] - extent[2]);
  const corner = (c, r) => [x0 + c * dx, y0 + r * dy, z[r * cols + c]];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = corner(c, r), b = corner(c + 1, r), d = corner(c, r + 1), e = corner(c + 1, r + 1);
      if (!(Number.isFinite(a[2]) && Number.isFinite(b[2]) && Number.isFinite(d[2]) && Number.isFinite(e[2]))) continue;
      [a, b, e, a, e, d].forEach((p) => { pos.push(p[0], p[1], p[2]); uv.push(u(p[0]), v(p[1])); });
    }
  }
  return { positions: new Float32Array(pos), uv: new Float32Array(uv), count: pos.length / 3 };
}

// The mesh as a non-indexed triangle list with one flat normal per triangle.
export function buildMesh(mesh) {
  const nv = mesh.nv | 0, nf = mesh.nf | 0;
  const p = typed(mesh.positions, Float32Array), col = b64ToBytes(mesh.colors), f = typed(mesh.faces, Uint32Array);
  const positions = new Float32Array(nf * 9), colors = new Uint8Array(nf * 9), normals = new Float32Array(nf * 9);
  for (let t = 0; t < nf; t++) {
    const ids = [f[t * 3], f[t * 3 + 1], f[t * 3 + 2]];
    if (ids.some((i) => i >= nv)) continue;
    const q = ids.map((i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]);
    let nrm = norm(cross(sub(q[1], q[0]), sub(q[2], q[0])));
    if (nrm[2] < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]];
    for (let k = 0; k < 3; k++) {
      positions.set(q[k], t * 9 + k * 3);
      normals.set(nrm, t * 9 + k * 3);
      colors.set([col[ids[k] * 3], col[ids[k] * 3 + 1], col[ids[k] * 3 + 2]], t * 9 + k * 3);
    }
  }
  return { positions, colors, normals, count: nf * 3 };
}

// The track's uncertainty band: a ribbon `halfWidth` meters each side of the
// path [[x, y, z, u], ...] (u = relative uncertainty, 0-1), colored from light
// orange (u = 0) to dark orange (u = 1). zAt(x, y) gives the ground under the
// ribbon; it is drawn `lift` meters above it so points do not hide it. Where
// the ground is unknown the last known ground height carries on (the path's
// own z, the phone's height, is used only when there is no ground at all).
export const BAND_LIGHT = [0.996, 0.85, 0.7];
export const BAND_DARK = [0.85, 0.28, 0.06];
export const BAND_LIFT = 0.12;
export function buildRibbon(path, halfWidth, zAt, lift) {
  const pos = [], col = [];
  const n = path.length;
  const up = lift == null ? BAND_LIFT : lift;
  if (n < 2) return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
  const ground = path.map((p) => (zAt ? zAt(p[0], p[1]) : NaN));
  const firstKnown = ground.find(Number.isFinite);
  let last = firstKnown;
  const level = ground.map((g, i) => {
    if (Number.isFinite(g)) last = g;
    return last !== undefined ? last + up : path[i][2];
  });
  const side = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * halfWidth, ny = dx / len * halfWidth;
    const c = BAND_LIGHT.map((lo, k) => lo + (BAND_DARK[k] - lo) * Math.max(0, Math.min(1, p[3])));
    return { l: [p[0] + nx, p[1] + ny, level[i]], r: [p[0] - nx, p[1] - ny, level[i]], c };
  });
  for (let i = 0; i < n - 1; i++) {
    const a = side[i], b = side[i + 1];
    [[a.l, a.c], [a.r, a.c], [b.r, b.c], [a.l, a.c], [b.r, b.c], [b.l, b.c]].forEach((v) => { pos.push(...v[0]); col.push(...v[1]); });
  }
  return { positions: new Float32Array(pos), colors: new Float32Array(col), count: pos.length / 3 };
}

// The profile line clipped to where there is data: sampled at n + 1 points,
// kept from the first to the last sample with a DEM height under it (or,
// without a DEM, inside the cloud's x/y box). Each kept point gets the ground
// height plus `lift`; gaps inside the run carry the last known height.
// Returns null when the line misses the data.
export function clipProfile(line, groundAt, box, lift, n) {
  const steps = n || 120;
  const samples = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = line[0][0] + (line[1][0] - line[0][0]) * t, y = line[0][1] + (line[1][1] - line[0][1]) * t;
    const g = groundAt ? groundAt(x, y) : NaN;
    const inside = groundAt ? Number.isFinite(g) : x >= box[0] && x <= box[1] && y >= box[2] && y <= box[3];
    samples.push({ x, y, g, inside });
  }
  let first = samples.findIndex((p) => p.inside), last = -1;
  for (let i = samples.length - 1; i >= 0; i--) if (samples[i].inside) { last = i; break; }
  if (first < 0) return null;
  let ground = Number.isFinite(samples[first].g) ? samples[first].g : box[4];
  return samples.slice(first, last + 1).map((p) => {
    if (Number.isFinite(p.g)) ground = p.g;
    return [p.x, p.y, ground + (lift || 0)];
  });
}

// Keys of the selectable points inside a world rectangle [x0, x1, y0, y1].
export function keysInRect(selectable, rect) {
  const out = [];
  if (!selectable || !Array.isArray(selectable.ids)) return out;
  const xlo = Math.min(rect[0], rect[1]), xhi = Math.max(rect[0], rect[1]);
  const ylo = Math.min(rect[2], rect[3]), yhi = Math.max(rect[2], rect[3]);
  for (let i = 0; i < selectable.ids.length; i++) {
    const x = selectable.x[i], y = selectable.y[i];
    if (x >= xlo && x <= xhi && y >= ylo && y <= yhi) out.push(selectable.ids[i]);
  }
  return out;
}

// ---- along the walk --------------------------------------------------------

// Cumulative length of the track [[x, y, z], ...] at each vertex.
export function trackLengths(track) {
  const out = [0];
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i];
    out.push(out[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return out;
}

// The track point at `fraction` (0-1) of its length, interpolated between
// vertices by cumulative length, as the app's onTrack(); null for a track of
// fewer than two points or no length.
export function onTrack(track, lengths, fraction) {
  const total = lengths[lengths.length - 1];
  if (track.length < 2 || !(total > 0)) return null;
  const target = Math.max(0, Math.min(1, fraction)) * total;
  let i = lengths.findIndex((l) => l >= target);
  i = Math.max(1, Math.min(track.length - 1, i < 0 ? track.length - 1 : i));
  const span = lengths[i] - lengths[i - 1];
  const u = span > 0 ? (target - lengths[i - 1]) / span : 0;
  const a = track[i - 1], b = track[i];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

// A 3D view focused on a point of the walk cuts away what lies nearer the
// viewer than half the view's height (in world units, at the focus) in front
// of the focus, as the app does. Returns that depth from the camera, in
// meters; geometry with a smaller depth is not drawn.
export function cutDepth(view, aspect) {
  const halfH = view.dist * Math.tan(FOVY / 2) * Math.min(1, aspect > 0 ? aspect : 1);
  return Math.max(0, view.dist - halfH);
}

// The shaders apply the same test to every point and fragment.
export function isCutAway(depth, cut) {
  return cut > 0 && depth < cut;
}

// ---- camera ---------------------------------------------------------------

// A view whose camera looks at the cloud from an oblique angle (or straight
// down in plan) and is just far enough back that the cloud fills the canvas
// of the given aspect (width / height). It fits `points` (a sample of the
// cloud) when given, keeping 99.5% of them inside, else the eight corners of
// `box`; then it pans so the fitted points sit in the middle.
const FOVY = Math.PI / 4;
const START_AZ = -0.6;
const START_EL = 0.62;
const FIT_MARGIN = 0.93;

export function initialView(box, mode, aspect, points) {
  const a = aspect > 0 ? aspect : 1.5;
  const pts = Array.isArray(points) && points.length >= 8 ? points : boxCorners(box);
  const keep = pts === points ? 0.995 : 1;
  let view = { mode: mode === "plan" ? "plan" : "3d", target: [(box[0] + box[1]) / 2, (box[2] + box[3]) / 2, (box[4] + box[5]) / 2], dist: 1, az: START_AZ, el: START_EL, halfH: 1 };
  const w = 100 * a, h = 100;
  // NDC of every point under a view, and the share of them inside the margin.
  const ndc = (v) => {
    const m = viewMatrices(v, w, h);
    return pts.map((p) => { const c = mulPoint(m.proj, mulPoint(m.view, p)); return c[3] > 0 ? [c[0] / c[3], c[1] / c[3]] : [Infinity, Infinity]; });
  };
  const inside = (v) => {
    const q = ndc(v);
    return q.filter((c) => Math.abs(c[0]) <= FIT_MARGIN && Math.abs(c[1]) <= FIT_MARGIN).length / q.length >= keep;
  };
  const span = Math.hypot(box[1] - box[0], box[3] - box[2], box[5] - box[4]) + 1;
  for (let pass = 0; pass < 3; pass++) {
    let lo = span * 0.01, hi = span * 20;
    const key = view.mode === "plan" ? "halfH" : "dist";
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inside(Object.assign({}, view, { [key]: mid }))) hi = mid; else lo = mid;
    }
    view = Object.assign({}, view, { [key]: hi });
    // Pan so the fitted points' NDC extent is centred.
    const q = ndc(view).filter((c) => Number.isFinite(c[0])).sort((p1, p2) => p1[0] - p2[0]);
    const xs = q.map((c) => c[0]).sort((x1, x2) => x1 - x2), ys = q.map((c) => c[1]).sort((y1, y2) => y1 - y2);
    const lowQ = (arr) => arr[Math.floor((1 - keep) / 2 * (arr.length - 1))], highQ = (arr) => arr[Math.ceil((1 - (1 - keep) / 2) * (arr.length - 1))];
    const cx = (lowQ(xs) + highQ(xs)) / 2, cy = (lowQ(ys) + highQ(ys)) / 2;
    view = panNdc(view, cx, cy, w, h);
  }
  return view;
}

function boxCorners(box) {
  const corners = [];
  for (let i = 0; i < 8; i++) corners.push([box[i & 1 ? 1 : 0], box[i & 2 ? 3 : 2], box[i & 4 ? 5 : 4]]);
  return corners;
}

// Moves the target so the point now at NDC (cx, cy) comes to the center.
function panNdc(view, cx, cy, w, h) {
  const m = viewMatrices(view, w, h);
  const halfH = view.mode === "plan" ? view.halfH : view.dist * Math.tan(Math.PI / 8);
  const halfW = halfH * (w / h);
  // Camera right and up vectors in world space are the rows of the view matrix.
  const right = [m.view[0], m.view[4], m.view[8]], up = [m.view[1], m.view[5], m.view[9]];
  const t = view.target.slice();
  for (let k = 0; k < 3; k++) t[k] += right[k] * cx * halfW + up[k] * cy * halfH;
  return Object.assign({}, view, { target: t });
}

function mulPoint(m, p) {
  const w = p.length === 4 ? p[3] : 1;
  return [0, 1, 2, 3].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * w);
}

export function viewMatrices(view, width, height) {
  const aspect = width / Math.max(1, height);
  if (view.mode === "plan") {
    const eye = [view.target[0], view.target[1], view.target[2] + 1000];
    return { view: lookAt(eye, view.target, [0, 1, 0]), proj: orthographic(view.halfH * aspect, view.halfH, 1, 3000), eye, pixelsPerMeter: height / (2 * view.halfH) };
  }
  const ce = Math.cos(view.el);
  const eye = [view.target[0] - Math.sin(view.az) * ce * view.dist, view.target[1] - Math.cos(view.az) * ce * view.dist, view.target[2] + Math.sin(view.el) * view.dist];
  return { view: lookAt(eye, view.target, [0, 0, 1]), proj: perspective(FOVY, aspect, view.dist / 200, view.dist * 20), eye, projScale: height / (2 * Math.tan(FOVY / 2)) };
}

// Drag by (dx, dy) pixels: rotate in 3D (pan with `pan`), pan in plan.
export function dragView(view, dx, dy, width, height, pan) {
  const next = Object.assign({}, view, { target: view.target.slice() });
  if (view.mode === "plan" || pan) {
    const m = view.mode === "plan" ? (2 * view.halfH) / height : (view.dist * 1.0) / height;
    const right = view.mode === "plan" ? [1, 0, 0] : [Math.cos(view.az), -Math.sin(view.az), 0];
    const fwd = view.mode === "plan" ? [0, 1, 0] : [Math.sin(view.az), Math.cos(view.az), 0];
    for (let k = 0; k < 3; k++) next.target[k] += -dx * m * right[k] + dy * m * fwd[k];
    return next;
  }
  next.az = view.az + dx * 0.008;
  next.el = Math.max(0.05, Math.min(Math.PI / 2 - 0.01, view.el + dy * 0.008));
  return next;
}

export function zoomView(view, factor) {
  const f = Math.max(0.05, Math.min(20, factor));
  return Object.assign({}, view, view.mode === "plan" ? { halfH: view.halfH * f } : { dist: view.dist * f });
}

// ---- color ramps ----------------------------------------------------------

function rampBytes() {
  const out = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const c = d3.rgb(d3.interpolateViridis(i / 255));
    out.set([c.r, c.g, c.b, 255], i * 4);
  }
  return out;
}

function classBytes(classColors) {
  const out = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) out.set([153, 153, 153, 255], i * 4);
  Object.keys(classColors || {}).forEach((code) => {
    const c = d3.rgb(classColors[code]);
    const i = +code;
    if (i >= 0 && i < 256) out.set([c.r, c.g, c.b, 255], i * 4);
  });
  return out;
}

// ---- renderer -------------------------------------------------------------

const POINT_VERT = `
precision highp float;
attribute vec3 position;
attribute vec3 color;
attribute float cls;
attribute float sigma;
attribute float src;
uniform mat4 view, proj;
uniform vec3 bboxMin, bboxSpan;
uniform float showLidar, showCamera;
uniform int mode;
uniform vec2 zRange, sigmaRange;
uniform float pointSize, worldSize, projScale, pixelsPerMeter, isPlan, cutDepth;
uniform sampler2D ramp, classTex;
varying vec3 vColor;
varying float vDepth;
void main() {
  if ((src < 0.5 && showLidar < 0.5) || (src > 0.5 && showCamera < 0.5)) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vDepth = 0.0;
    return;
  }
  vec3 world = bboxMin + position * bboxSpan;
  vec4 eye = view * vec4(world, 1.0);
  float depth = -eye.z;
  if (depth < cutDepth) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec3(0.0);
    vDepth = 0.0;
    return;
  }
  gl_Position = proj * eye;
  vDepth = depth;
  float worldPx = isPlan > 0.5 ? worldSize * pixelsPerMeter : worldSize * projScale / max(depth, 0.01);
  gl_PointSize = clamp(max(pointSize, worldPx), 1.0, 24.0);
  if (mode == 0) {
    vColor = color;
  } else if (mode == 1) {
    vColor = texture2D(classTex, vec2((cls + 0.5) / 256.0, 0.5)).rgb;
  } else if (mode == 2) {
    float t = clamp((position.z - zRange.x) / max(zRange.y - zRange.x, 1e-6), 0.0, 1.0);
    vColor = texture2D(ramp, vec2(t, 0.5)).rgb;
  } else {
    float t = clamp((sigma - sigmaRange.x) / max(sigmaRange.y - sigmaRange.x, 1e-6), 0.0, 1.0);
    vColor = texture2D(ramp, vec2(t, 0.5)).rgb;
  }
}`;

const POINT_FRAG = `
precision highp float;
varying vec3 vColor;
varying float vDepth;
uniform float isPlan, fogNear, fogFar;
uniform vec3 background;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  // Shade each point as a small sphere lit from the viewer, and fade far
  // points toward the background, so surfaces and depth read.
  float shade = 0.72 + 0.28 * sqrt(1.0 - r2);
  vec3 c = vColor * shade;
  if (isPlan < 0.5) {
    float fog = clamp((vDepth - fogNear) / max(fogFar - fogNear, 1e-3), 0.0, 1.0) * 0.45;
    c = mix(c, background, fog);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

export class PointCloudRenderer {
  static type = "pointcloud";
  static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: {} };
  static scaleHints = null;
  static dataContract = {};

  render(chart, layer) {
    const opts = layer.options || {};
    let view = chart.runtime.pointcloud;
    if (view && view.layerOptions !== opts) {
      // The same cloud with new options (e.g. a moved profile line from
      // updateMyIOOptions()) updates in place and keeps the camera.
      if (view.update && view.layerOptions.positions === opts.positions) {
        view.update(opts);
      } else {
        view.dispose();
        view = null;
      }
    }
    if (!view) view = chart.runtime.pointcloud = createView(chart, layer, opts);
    view.resize();
  }

  remove(chart) {
    if (chart.runtime && chart.runtime.pointcloud) chart.runtime.pointcloud.dispose();
  }
}

function createView(chart, layer, opts) {
  const margin = chart.margin || chart.config.layout.margin;
  const root = chart.dom.chartArea.append("foreignObject").attr("class", "myIO-pointcloud-root");
  const host = root.append("xhtml:div").attr("class", "myIO-pointcloud");
  const canvasSel = host.append("canvas").attr("class", "myIO-pointcloud-canvas")
    .attr("aria-label", (layer.label || "Point cloud") + ": drag to rotate, scroll or pinch to zoom");
  const canvas = canvasSel.node();
  const state = {
    color: ["rgb", "height", "sigma"].indexOf(opts.color) >= 0 ? opts.color : (opts.rgb ? "rgb" : "height"),
    classes: opts.color === "class",
    lidar: true,
    camera: true,
    ortho: opts.ortho ? opts.showOrtho !== false : false,
    surface: opts.surface === "mesh" && opts.mesh ? "mesh" : "points",
    selecting: false,
    selection: null,
    along: 0,
    focus: null,
    view: null
  };

  const dispose = () => {
    if (state.disposed) return;
    state.disposed = true;
    if (state.regl) state.regl.destroy();
    root.remove();
    chart.off("destroy", dispose);
    if (chart.runtime && chart.runtime.pointcloud === api) chart.runtime.pointcloud = null;
  };
  const api = { layerOptions: opts, dispose, resize: () => {}, root, state };
  chart.on("destroy", dispose);

  api.resize = () => sizeRoot();
  api.ready = import("regl").then((mod) => {
    if (state.disposed) return;
    setup(mod.default || mod);
    api.resize();
  }, () => {
    host.append("div").attr("class", "myIO-pointcloud-message").text("This browser cannot draw the point cloud (WebGL is not available).");
  });
  return api;

  function sizeRoot() {
    const w = Math.max(0, chart.width - margin.left - margin.right);
    const h = Math.max(0, chart.height - margin.top - margin.bottom);
    root.attr("width", w).attr("height", h);
    return [w, h];
  }

  function setup(createREGL) {
    let regl;
    try {
      regl = createREGL({ canvas, attributes: { antialias: true, preserveDrawingBuffer: true }, extensions: [] });
    } catch (err) {
      host.append("div").attr("class", "myIO-pointcloud-message").text("This browser cannot draw the point cloud (WebGL is not available).");
      return;
    }
    state.regl = regl;

    const cloud = decodeCloud(opts);
    const bbox = cloud.bbox;
    const aspect = () => canvas.width / Math.max(1, canvas.height);
    const fitBox = cloud.box;
    state.view = initialView(fitBox, opts.mode, 1.5, cloud.fitPoints);
    // The view refits to the canvas on every resize until the user moves it.
    let moved = false;
    let current = opts;
    const bboxMin = [bbox[0], bbox[2], bbox[4]];
    const bboxSpan = [bbox[1] - bbox[0], bbox[3] - bbox[2], bbox[5] - bbox[4]];
    const grid = decodeTerrain(opts.terrain);
    const groundAt = grid ? grid.at : null;
    const span = Math.max(bboxSpan[0], bboxSpan[1], 1);

    const positionBuffer = regl.buffer({ data: cloud.positions, type: "uint16" });
    const colorBuffer = regl.buffer({ data: cloud.rgb || new Uint8Array(cloud.n * 3).fill(140), type: "uint8" });
    const clsBuffer = regl.buffer({ data: cloud.cls || new Uint8Array(cloud.n), type: "uint8" });
    const sigmaBuffer = regl.buffer({ data: cloud.sigma || new Uint8Array(cloud.n), type: "uint8" });
    const srcBuffer = regl.buffer({ data: cloud.src || new Uint8Array(cloud.n), type: "uint8" });
    const ramp = regl.texture({ width: 256, height: 1, data: rampBytes() });
    const classTex = regl.texture({ width: 256, height: 1, data: classBytes(opts.classColors) });

    const drawPoints = regl({
      vert: POINT_VERT,
      frag: POINT_FRAG,
      attributes: {
        position: { buffer: positionBuffer, normalized: true, size: 3 },
        color: { buffer: colorBuffer, normalized: true, size: 3 },
        cls: { buffer: clsBuffer, normalized: false, size: 1 },
        sigma: { buffer: sigmaBuffer, normalized: true, size: 1 },
        src: { buffer: srcBuffer, normalized: false, size: 1 }
      },
      uniforms: {
        view: regl.prop("view"), proj: regl.prop("proj"),
        bboxMin, bboxSpan,
        mode: regl.prop("mode"),
        showLidar: regl.prop("showLidar"), showCamera: regl.prop("showCamera"),
        zRange: cloud.zRange, sigmaRange: cloud.sigmaRange,
        pointSize: regl.prop("pointSize"), worldSize: POINT_WORLD_SIZE,
        projScale: regl.prop("projScale"), pixelsPerMeter: regl.prop("pixelsPerMeter"), isPlan: regl.prop("isPlan"),
        ramp, classTex,
        fogNear: regl.prop("fogNear"), fogFar: regl.prop("fogFar"),
        background: regl.prop("background"), cutDepth: regl.prop("cutDepth")
      },
      count: cloud.n,
      primitive: "points",
      depth: { enable: true }
    });

    const drawLines = regl({
      vert: `precision highp float; attribute vec3 position; uniform mat4 view, proj;
        void main() { gl_Position = proj * view * vec4(position, 1.0); }`,
      frag: `precision highp float; uniform vec4 color; void main() { gl_FragColor = color; }`,
      attributes: { position: regl.prop("position") },
      uniforms: { view: regl.prop("view"), proj: regl.prop("proj"), color: regl.prop("color") },
      count: regl.prop("count"),
      primitive: regl.prop("primitive"),
      depth: { enable: false }
    });

    // Flat colored triangles: the track's uncertainty band.
    const drawTriangles = regl({
      vert: `precision highp float; attribute vec3 position; attribute vec3 color; uniform mat4 view, proj; varying vec3 vColor; varying float vDepth;
        void main() { vColor = color; vec4 eye = view * vec4(position, 1.0); vDepth = -eye.z; gl_Position = proj * eye; }`,
      frag: `precision highp float; varying vec3 vColor; varying float vDepth; uniform float alpha, cutDepth;
        void main() { if (vDepth < cutDepth) discard; gl_FragColor = vec4(vColor, alpha); }`,
      attributes: { position: regl.prop("position"), color: regl.prop("color") },
      uniforms: { view: regl.prop("view"), proj: regl.prop("proj"), alpha: regl.prop("alpha"), cutDepth: regl.prop("cutDepth") },
      count: regl.prop("count"),
      blend: { enable: true, func: { src: "src alpha", dst: "one minus src alpha" } },
      depth: { enable: regl.prop("depth"), mask: false }
    });

    // The mesh in its vertex colors, lit from above-front.
    let drawMesh = null, meshGeom = null;
    if (opts.mesh) {
      meshGeom = buildMesh(opts.mesh);
      drawMesh = regl({
        vert: `precision highp float; attribute vec3 position, normal; attribute vec3 color; uniform mat4 view, proj;
          varying vec3 vColor; varying vec3 vNormal; varying float vDepth;
          void main() { vColor = color; vNormal = normal; vec4 eye = view * vec4(position, 1.0); vDepth = -eye.z; gl_Position = proj * eye; }`,
        frag: `precision highp float; varying vec3 vColor; varying vec3 vNormal; varying float vDepth; uniform vec3 light, background; uniform float fogNear, fogFar, cutDepth;
          void main() { if (vDepth < cutDepth) discard; float l = 0.55 + 0.45 * abs(dot(normalize(vNormal), light));
            float fog = clamp((vDepth - fogNear) / max(fogFar - fogNear, 1e-3), 0.0, 1.0) * 0.45;
            gl_FragColor = vec4(mix(vColor * l, background, fog), 1.0); }`,
        attributes: {
          position: regl.buffer(meshGeom.positions),
          normal: regl.buffer(meshGeom.normals),
          color: { buffer: regl.buffer({ data: meshGeom.colors, type: "uint8" }), normalized: true }
        },
        uniforms: { view: regl.prop("view"), proj: regl.prop("proj"), light: norm([0.3, -0.4, 0.85]), background: regl.prop("background"),
          fogNear: regl.prop("fogNear"), fogFar: regl.prop("fogFar"), cutDepth: regl.prop("cutDepth") },
        count: meshGeom.count,
        cull: { enable: false },
        depth: { enable: true }
      });
    }

    // The orthophoto: a flat image in 2D, draped on the DEM in 3D.
    let drawFlatOrtho = null, drawDrape = null;
    if (opts.ortho && opts.ortho.src && Array.isArray(opts.ortho.extent)) {
      const e = opts.ortho.extent; // [xmin, xmax, ymin, ymax]
      const z = Number.isFinite(opts.ortho.z) ? opts.ortho.z : bbox[4];
      const image = new Image();
      image.onload = () => {
        if (state.disposed) return;
        const texture = regl.texture({ data: image, flipY: true, min: "linear", mag: "linear" });
        const textured = (count, attributes, depth) => regl({
          vert: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 view, proj; varying vec2 vUv; varying float vDepth;
            void main() { vUv = uv; vec4 eye = view * vec4(position, 1.0); vDepth = -eye.z; gl_Position = proj * eye; }`,
          frag: `precision highp float; varying vec2 vUv; varying float vDepth; uniform sampler2D tex; uniform vec3 background; uniform float fogNear, fogFar, cutDepth;
            void main() { if (vDepth < cutDepth) discard; vec4 c = texture2D(tex, vUv); if (c.a < 0.05) discard;
              float fog = clamp((vDepth - fogNear) / max(fogFar - fogNear, 1e-3), 0.0, 1.0) * 0.45;
              gl_FragColor = vec4(mix(c.rgb, background, fog), 1.0); }`,
          attributes,
          uniforms: { view: regl.prop("view"), proj: regl.prop("proj"), tex: texture, background: regl.prop("background"),
            fogNear: regl.prop("fogNear"), fogFar: regl.prop("fogFar"), cutDepth: regl.prop("cutDepth") },
          count,
          depth
        });
        drawFlatOrtho = textured(6, {
          position: [[e[0], e[2], z], [e[1], e[2], z], [e[1], e[3], z], [e[0], e[2], z], [e[1], e[3], z], [e[0], e[3], z]],
          uv: [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]
        }, { enable: true, mask: false });
        if (grid) {
          const drape = buildDrape(grid, e);
          if (drape.count > 0) {
            drawDrape = textured(drape.count, { position: regl.buffer(drape.positions), uv: regl.buffer(drape.uv) }, { enable: true });
          }
        }
        canvas.dataset.drape = drawDrape ? "ready" : "none";
        requestDraw();
      };
      image.src = opts.ortho.src;
    }

    const track = Array.isArray(opts.track) && opts.track.length > 1 ? opts.track.map((p) => [+p[0], +p[1], +p[2]]) : null;
    const lengths = track ? trackLengths(track) : null;
    const walkLength = lengths ? lengths[lengths.length - 1] : 0;
    const band = Array.isArray(opts.trackBand) && opts.trackBand.length > 1
      ? buildRibbon(opts.trackBand.map((p) => p.map(Number)), Math.max(0.15, Math.min(1, span * 0.012)), groundAt)
      : null;
    let profileLine = null;
    const setProfile = (o) => {
      const pr = o.profile;
      profileLine = Array.isArray(pr) && pr.length === 2 ? clipProfile(pr, groundAt, cloud.box, BAND_LIFT) : null;
    };
    setProfile(opts);

    // ---- overlay controls ----
    const top = host.append("div").attr("class", "myIO-pc-top");
    const segmented = (label, items, isOn, onClick) => {
      const g = top.append("div").attr("class", "myIO-pc-seg").attr("role", "group").attr("aria-label", label);
      const b = g.selectAll("button").data(items).join("button").attr("type", "button").text((d) => d[1]).on("click", (event, d) => onClick(d[0]));
      return { group: g, buttons: b, isOn };
    };
    const modeSeg = segmented("View", [["plan", "2D"], ["3d", "3D"]], (d) => d[0] === state.view.mode, (mode) => {
      if (mode !== state.view.mode) {
        state.view = initialView(fitBox, mode, aspect(), cloud.fitPoints);
        moved = false;
        state.focus = null;
        if (mode !== "plan") setSelecting(false);
      }
      syncControls(); requestDraw();
    });
    const surfaceSeg = drawMesh
      ? segmented("Surface", [["points", "Points"], ["mesh", "Mesh"]], (d) => d[0] === state.surface, (surface) => { state.surface = surface; syncControls(); requestDraw(); })
      : null;
    const selectable = opts.selectable && Array.isArray(opts.selectable.ids) ? opts.selectable : null;
    const selectButton = selectable
      ? top.append("button").attr("type", "button").attr("class", "myIO-pc-chip myIO-pc-select").text("Select")
        .attr("title", "Drag a rectangle to pick points for linked charts")
        .on("click", () => { setSelecting(!state.selecting); })
      : null;
    const hint = top.append("div").attr("class", "myIO-pc-hint");

    const bottom = host.append("div").attr("class", "myIO-pc-bottom");
    const card = bottom.append("div").attr("class", "myIO-pc-card");
    const setCaption = (caption) => {
      card.selectAll("*").remove();
      card.style("display", caption && (caption.shape || caption.map) ? null : "none");
      if (!caption) return;
      const figure = (label, value, note) => {
        if (!value) return;
        const f = card.append("div").attr("class", "myIO-pc-figure");
        f.append("div").attr("class", "myIO-pc-figure-label").text(label);
        f.append("div").attr("class", "myIO-pc-figure-value").text(value);
        if (note) f.append("div").attr("class", "myIO-pc-figure-note").text(note);
      };
      figure("Shape accuracy", caption.shape, caption.shapeNote);
      figure("Map position", caption.map, caption.mapNote);
    };
    setCaption(opts.caption);
    const legend = bottom.append("div").attr("class", "myIO-pc-legend");
    const chips = bottom.append("div").attr("class", "myIO-pc-chips");
    // Layer chips, each on or off on its own, as in the app.
    const layerChips = [["lidar", "LiDAR"]];
    if (cloud.cameraPoints > 0) layerChips.push(["camera", "Camera"]);
    if (cloud.cls) layerChips.push(["classes", "Classes"]);
    if (opts.ortho) layerChips.push(["ortho", "Ortho"]);
    const chipButtons = chips.selectAll("button.myIO-pc-chip-layer").data(layerChips).join("button")
      .attr("type", "button").attr("class", (d) => "myIO-pc-chip myIO-pc-chip-layer myIO-pc-chip-" + d[0]).text((d) => d[1])
      .on("click", (event, d) => { state[d[0]] = !state[d[0]]; syncControls(); requestDraw(); });
    // A walk whose camera points were withheld shows the Camera chip off,
    // with the reason next to it, as the app does.
    const cameraNote = cloud.cameraPoints === 0 && opts.caption && opts.caption.cameraNote ? opts.caption.cameraNote : null;
    if (cameraNote) {
      const classesChip = chips.select(".myIO-pc-chip-classes").node();
      const off = chips.insert("button", classesChip ? () => classesChip : null)
        .attr("type", "button").attr("class", "myIO-pc-chip myIO-pc-chip-disabled").attr("disabled", true)
        .attr("aria-disabled", "true").text("Camera");
      off.attr("title", cameraNote);
      bottom.insert("div", ".myIO-pc-seg-small").attr("class", "myIO-pc-chip-note").text(cameraNote);
    }
    const colorModes = [["rgb", "Photo"], ["height", "Height"]];
    if (cloud.sigma) colorModes.push(["sigma", "Sigma"]);
    if (!cloud.rgb) colorModes.shift();
    const colorSeg = bottom.append("div").attr("class", "myIO-pc-seg myIO-pc-seg-small").attr("role", "group").attr("aria-label", "Point color");
    const colorButtons = colorSeg.selectAll("button").data(colorModes).join("button").attr("type", "button").text((d) => d[1])
      .on("click", (event, d) => { state.color = d[0]; state.classes = false; syncControls(); requestDraw(); });
    // Along the walk, as in the app: a distance fraction of the track. In 3D
    // it turns the orbit about that point and cuts away what is in front of
    // it; in 2D it centers the plan on the point and marks it.
    const alongRow = walkLength > 0 ? bottom.append("div").attr("class", "myIO-pc-along") : null;
    let alongInput = null, wholeWalk = null;
    if (alongRow) {
      alongRow.append("svg").attr("class", "myIO-pc-along-icon").attr("viewBox", "0 0 20 20").attr("aria-hidden", "true")
        .call((svg) => {
          svg.append("path").attr("d", "M4 5 C 10 5, 6 15, 16 15").attr("fill", "none").attr("stroke", "currentColor").attr("stroke-width", 1.8).attr("stroke-dasharray", "2.5 2");
          svg.append("circle").attr("cx", 4).attr("cy", 5).attr("r", 2.4).attr("fill", "currentColor");
          svg.append("circle").attr("cx", 16).attr("cy", 15).attr("r", 2.4).attr("fill", "currentColor");
        });
      alongInput = alongRow.append("input").attr("type", "range").attr("class", "myIO-pc-along-input")
        .attr("min", 0).attr("max", 1).attr("step", 0.005).attr("value", 0)
        .attr("aria-label", "Position along the walk")
        .on("input", (event) => lookAlong(+event.target.value))
        // The chart's keyboard navigation on the SVG would take the arrow keys.
        .on("keydown", (event) => event.stopPropagation());
      // Once the slider has focused the view on a point of the walk, Whole
      // walk clears the focus and the zoom and shows the full scan again.
      wholeWalk = alongRow.append("button").attr("type", "button").attr("class", "myIO-pc-chip myIO-pc-whole")
        .attr("title", "Show the whole scan again").text("Whole walk")
        .on("click", () => { state.focus = null; refit(); });
    }
    const focusMark = host.append("div").attr("class", "myIO-pc-focus").attr("aria-hidden", "true").style("display", "none");
    const scale = host.append("div").attr("class", "myIO-pc-scale");
    const rectBox = host.append("div").attr("class", "myIO-pc-rect").style("display", "none");

    function lookAlong(fraction) {
      state.along = fraction;
      const at = onTrack(track, lengths, fraction);
      if (!at) return;
      state.focus = at;
      state.view = Object.assign({}, state.view, { target: state.view.mode === "plan" ? [at[0], at[1], state.view.target[2]] : at.slice() });
      moved = true;
      syncControls();
      requestDraw();
    }

    function refit() {
      state.view = initialView(fitBox, state.view.mode, aspect(), cloud.fitPoints);
      moved = false;
      syncControls();
      requestDraw();
    }

    function syncControls() {
      const plan = state.view.mode === "plan";
      modeSeg.buttons.classed("is-on", modeSeg.isOn).attr("aria-pressed", (d) => String(modeSeg.isOn(d)));
      if (surfaceSeg) {
        surfaceSeg.group.style("display", plan ? "none" : null);
        surfaceSeg.buttons.classed("is-on", surfaceSeg.isOn).attr("aria-pressed", (d) => String(surfaceSeg.isOn(d)));
      }
      if (selectButton) {
        selectButton.style("display", plan ? null : "none").classed("is-on", state.selecting).attr("aria-pressed", String(state.selecting));
      }
      chipButtons.classed("is-on", (d) => !!state[d[0]]).attr("aria-pressed", (d) => String(!!state[d[0]]));
      const showAlong = !!alongRow && current.slider !== false;
      if (!showAlong) state.focus = null;
      if (alongRow) {
        alongRow.style("display", showAlong ? null : "none");
        alongInput.property("value", state.along)
          .attr("aria-valuetext", Math.round(state.along * walkLength) + " of " + Math.round(walkLength) + " meters");
        wholeWalk.style("display", state.focus ? null : "none");
      }
      colorButtons.classed("is-on", (d) => !state.classes && d[0] === state.color).attr("aria-pressed", (d) => String(!state.classes && d[0] === state.color));
      hint.text(state.selecting ? "Drag a rectangle to pick points; Esc clears"
        : plan ? "Drag to pan · scroll or pinch to zoom" : "Drag to rotate · shift-drag to pan · scroll or pinch to zoom");
      legend.selectAll("*").remove();
      const showingPoints = state.surface === "points" || plan;
      if (showingPoints && state.classes) {
        const names = opts.classNames || {};
        const colors = opts.classColors || {};
        cloud.classes.forEach((code) => {
          const item = legend.append("span").attr("class", "myIO-pc-legend-item");
          item.append("i").style("background", colors[code] || "#999");
          item.append("span").text(names[code] || "Class " + code);
        });
      } else if (showingPoints && (state.color === "height" || state.color === "sigma")) {
        const range = state.color === "height"
          ? cloud.zRange.map((t) => bbox[4] + t * (bbox[5] - bbox[4]))
          : cloud.sigmaRange.map((t) => sigmaFromByte(t * 255));
        const fmt = state.color === "height" ? (v) => v.toFixed(1) + " m" : (v) => (v < 1 ? (v * 100).toFixed(1) + " cm" : v.toFixed(2) + " m");
        legend.append("span").attr("class", "myIO-pc-legend-label").text(state.color === "height" ? "Height" : "Sigma");
        legend.append("span").text(fmt(range[0]));
        legend.append("i").attr("class", "myIO-pc-ramp");
        legend.append("span").text(fmt(range[1]));
      }
      if (band) {
        const item = legend.append("span").attr("class", "myIO-pc-legend-item");
        item.append("i").attr("class", "myIO-pc-band-swatch");
        item.append("span").text("Track uncertainty, low to high");
      }
      canvas.dataset.mode = state.view.mode;
      canvas.dataset.surface = state.surface;
    }

    // ---- drawing ----
    let frame = null;
    function requestDraw() {
      if (frame || state.disposed) return;
      frame = requestAnimationFrame(() => { frame = null; draw(); });
    }

    function draw() {
      const w = canvas.width, h = canvas.height;
      if (!w || !h) return;
      regl.poll();
      const plan = state.view.mode === "plan";
      const bg = plan ? themeBackground(host.node()) : BACKGROUND_3D;
      regl.clear({ color: bg, depth: 1 });
      host.classed("is-3d", !plan);
      const m = viewMatrices(state.view, w, h);
      const dpr = canvas.width / Math.max(1, canvas.clientWidth || canvas.width);
      const cut = !plan && state.focus ? cutDepth(state.view, w / h) : 0;
      canvas.dataset.cut = cut > 0 ? "1" : "0";
      const fog = { fogNear: plan ? 1e6 : state.view.dist * 0.6, fogFar: plan ? 2e6 : state.view.dist * 1.8, background: bg.slice(0, 3), cutDepth: cut };
      if (state.ortho) {
        if (plan && drawFlatOrtho) drawFlatOrtho(Object.assign({ view: m.view, proj: m.proj }, fog));
        if (!plan && drawDrape) drawDrape(Object.assign({ view: m.view, proj: m.proj }, fog));
      }
      if (!plan && state.surface === "mesh" && drawMesh) {
        drawMesh(Object.assign({ view: m.view, proj: m.proj }, fog));
      } else {
        drawPoints(Object.assign({
          view: m.view, proj: m.proj,
          mode: state.classes ? 1 : COLOR_MODES.indexOf(state.color),
          showLidar: state.lidar ? 1 : 0, showCamera: state.camera ? 1 : 0,
          pointSize: (current.pointSize > 0 ? current.pointSize : 2) * dpr,
          projScale: m.projScale || 1, pixelsPerMeter: m.pixelsPerMeter || 1, isPlan: plan ? 1 : 0
        }, fog));
      }
      if (band && band.count) drawTriangles({ view: m.view, proj: m.proj, position: band.positions, color: band.colors, count: band.count, alpha: 0.85, depth: !plan, cutDepth: cut });
      // The phone's path runs at hand height. In 2D it is the line inside the
      // band, as in the app; in 3D, with the band on the ground, it would
      // float above it, so the band alone shows the track there.
      const phonePath = !!track && (plan || !band);
      canvas.dataset.phonePath = phonePath ? "1" : "0";
      if (phonePath) drawLines({ view: m.view, proj: m.proj, position: track, count: track.length, color: plan ? [0.11, 0.14, 0.19, 1] : [0.94, 0.62, 0.2, 1], primitive: "line strip" });
      if (profileLine) drawLines({ view: m.view, proj: m.proj, position: profileLine, count: profileLine.length, color: plan ? [0, 0.447, 0.698, 1] : [0.34, 0.71, 0.91, 1], primitive: "line strip" });
      if (plan) {
        const ppm = (m.pixelsPerMeter || 1) / dpr;
        const target = 90 / ppm;
        const pow = Math.pow(10, Math.floor(Math.log10(target)));
        const nice = [1, 2, 5, 10].map((k) => k * pow).filter((v) => v <= target).pop() || pow;
        scale.style("display", null).style("color", scaleInk(bg)).style("width", Math.round(nice * ppm) + "px").text(nice >= 1 ? nice + " m" : Math.round(nice * 100) + " cm");
      } else {
        scale.style("display", "none");
      }
      placeSelection();
      if (plan && state.focus) {
        const p = planPixel(state.focus[0], state.focus[1]);
        focusMark.style("display", null).style("left", p[0] + "px").style("top", p[1] + "px");
      } else {
        focusMark.style("display", "none");
      }
      canvas.dataset.frames = String((+canvas.dataset.frames || 0) + 1);
    }

    // ---- 2D selection, sent to linked charts as the points' keys ----
    // World point under a canvas pixel in plan mode.
    function planWorld(px, py) {
      const cw = canvas.clientWidth, chh = canvas.clientHeight;
      const halfH = state.view.halfH, halfW = halfH * cw / Math.max(1, chh);
      return [state.view.target[0] + (px / cw * 2 - 1) * halfW, state.view.target[1] - (py / chh * 2 - 1) * halfH];
    }
    function planPixel(x, y) {
      const cw = canvas.clientWidth, chh = canvas.clientHeight;
      const halfH = state.view.halfH, halfW = halfH * cw / Math.max(1, chh);
      return [((x - state.view.target[0]) / halfW + 1) / 2 * cw, (1 - (y - state.view.target[1]) / halfH) / 2 * chh];
    }
    function placeSelection() {
      if (!state.selection || state.view.mode !== "plan") { rectBox.style("display", "none"); return; }
      const r = state.selection;
      const a = planPixel(Math.min(r[0], r[1]), Math.max(r[2], r[3])), b = planPixel(Math.max(r[0], r[1]), Math.min(r[2], r[3]));
      rectBox.style("display", null).style("left", a[0] + "px").style("top", a[1] + "px")
        .style("width", Math.max(0, b[0] - a[0]) + "px").style("height", Math.max(0, b[1] - a[1]) + "px");
    }
    function sendSelection(rect) {
      state.selection = rect;
      if (!rect) {
        chart.emit("brushed", { data: [], keys: [], active: false });
      } else {
        const key = selectable.key || "point_id";
        const ids = keysInRect(selectable, rect);
        chart.emit("brushed", { data: ids.map((id) => ({ [key]: id })), keys: [], active: true });
        canvas.dataset.selected = String(ids.length);
      }
      placeSelection();
    }
    function setSelecting(on) {
      state.selecting = !!on && !!selectable;
      if (!state.selecting && state.selection) sendSelection(null);
      syncControls();
    }
    d3.select(host.node()).on("keydown.pcselect", (event) => { if (event.key === "Escape" && state.selection) sendSelection(null); });

    // ---- interaction ----
    const pointers = new Map();
    let pinch = null, dragRect = null;
    canvasSel
      .attr("tabindex", 0)
      .on("contextmenu", (event) => event.preventDefault())
      .on("pointerdown", (event) => {
        canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
        if (state.selecting && state.view.mode === "plan" && event.button === 0) {
          const box = canvas.getBoundingClientRect();
          const start = planWorld(event.clientX - box.left, event.clientY - box.top);
          dragRect = [start[0], start[0], start[1], start[1]];
          return;
        }
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 2 });
        if (pointers.size === 2) {
          const [a, b] = Array.from(pointers.values());
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), view: state.view };
        }
      })
      .on("pointermove", (event) => {
        if (dragRect) {
          const box = canvas.getBoundingClientRect();
          const p = planWorld(event.clientX - box.left, event.clientY - box.top);
          dragRect[1] = p[0];
          dragRect[3] = p[1];
          state.selection = dragRect.slice();
          placeSelection();
          return;
        }
        const p = pointers.get(event.pointerId);
        if (!p) return;
        const dx = event.clientX - p.x, dy = event.clientY - p.y;
        p.x = event.clientX; p.y = event.clientY;
        moved = true;
        if (pointers.size === 2 && pinch) {
          const [a, b] = Array.from(pointers.values());
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          state.view = zoomView(pinch.view, pinch.d / Math.max(d, 1));
        } else {
          state.view = dragView(state.view, dx, dy, canvas.clientWidth, canvas.clientHeight, p.pan);
        }
        requestDraw();
      })
      .on("pointerup pointercancel", (event) => {
        if (dragRect) {
          const r = dragRect;
          dragRect = null;
          sendSelection(Math.abs(r[1] - r[0]) > 1e-6 && Math.abs(r[3] - r[2]) > 1e-6 ? r : null);
          return;
        }
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinch = null;
      })
      .on("wheel", (event) => {
        event.preventDefault();
        moved = true;
        state.view = zoomView(state.view, Math.exp(event.deltaY * 0.0015));
        requestDraw();
      })
      .on("dblclick", () => { state.focus = null; refit(); });

    api.resize = () => {
      const [w, h] = sizeRoot();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!moved && w > 0 && h > 0) state.view = initialView(fitBox, state.view.mode, aspect(), cloud.fitPoints);
      syncControls();
      requestDraw();
    };
    // New options for the same cloud: profile line, caption and point size
    // change in place; the camera and layer toggles stay as they are.
    api.update = (next) => {
      current = next;
      api.layerOptions = next;
      setProfile(next);
      setCaption(next.caption);
      syncControls();
      requestDraw();
    };
    api.draw = draw;
    api.getView = () => state.view;
  }
}
