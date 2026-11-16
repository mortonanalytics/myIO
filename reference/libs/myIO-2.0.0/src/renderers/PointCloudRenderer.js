// pointcloud: a WebGL point cloud with a 3D orbit view and a top-down plan
// view, color by RGB / class / height / sigma, an optional orthophoto under
// the points, the walk track, and an accuracy caption card.
//
// The points arrive packed (see R/pointcloud.R, pointcloud_payload()):
// positions as interleaved Uint16 x, y, z scaled to options.bbox, colors as
// Uint8 r, g, b, class codes as Uint8, and sigma as Uint8 on a log scale
// (byte = (log10(sigma_m) + 3) / 4 * 255). Each array is base64.
//
// regl is imported lazily, as the other WebGL renderers do, so loading the
// engine's ES modules directly (no bundler) does not need it resolved.
import { b64ToBytes } from "../utils/b64-to-bytes.js";

export const COLOR_MODES = ["rgb", "class", "height", "sigma"];
const COLOR_LABELS = { rgb: "Color", class: "Classes", height: "Height", sigma: "Sigma" };
const BACKGROUND = [0.969, 0.973, 0.98, 1];
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
  return { n, positions, rgb, cls, sigma, bbox, box, fitPoints, zRange, sigmaRange, classes };
}

export function sigmaFromByte(b) { return Math.pow(10, b / 255 * 4 - 3); }

// ---- camera ---------------------------------------------------------------

// A view whose camera looks at the cloud from an oblique angle (or straight
// down in plan) and is just far enough back that the cloud fills the canvas
// of the given aspect (width / height). It fits `points` (a sample of the
// cloud) when given, keeping 99.5% of them inside, else the eight corners of
// `box`; then it pans so the fitted points sit in the middle.
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
  const fovy = Math.PI / 4;
  return { view: lookAt(eye, view.target, [0, 0, 1]), proj: perspective(fovy, aspect, view.dist / 200, view.dist * 20), eye, projScale: height / (2 * Math.tan(fovy / 2)) };
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
uniform mat4 view, proj;
uniform vec3 bboxMin, bboxSpan;
uniform int mode;
uniform vec2 zRange, sigmaRange;
uniform float pointSize, worldSize, projScale, pixelsPerMeter, isPlan;
uniform sampler2D ramp, classTex;
varying vec3 vColor;
varying float vDepth;
void main() {
  vec3 world = bboxMin + position * bboxSpan;
  vec4 eye = view * vec4(world, 1.0);
  gl_Position = proj * eye;
  float depth = -eye.z;
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
      view.dispose();
      view = null;
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
    color: COLOR_MODES.indexOf(opts.color) >= 0 ? opts.color : (opts.rgb ? "rgb" : "height"),
    ortho: opts.ortho ? opts.showOrtho !== false : false,
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
    const bboxMin = [bbox[0], bbox[2], bbox[4]];
    const bboxSpan = [bbox[1] - bbox[0], bbox[3] - bbox[2], bbox[5] - bbox[4]];

    const positionBuffer = regl.buffer({ data: cloud.positions, type: "uint16" });
    const colorBuffer = regl.buffer({ data: cloud.rgb || new Uint8Array(cloud.n * 3).fill(140), type: "uint8" });
    const clsBuffer = regl.buffer({ data: cloud.cls || new Uint8Array(cloud.n), type: "uint8" });
    const sigmaBuffer = regl.buffer({ data: cloud.sigma || new Uint8Array(cloud.n), type: "uint8" });
    const ramp = regl.texture({ width: 256, height: 1, data: rampBytes() });
    const classTex = regl.texture({ width: 256, height: 1, data: classBytes(opts.classColors) });

    const drawPoints = regl({
      vert: POINT_VERT,
      frag: POINT_FRAG,
      attributes: {
        position: { buffer: positionBuffer, normalized: true, size: 3 },
        color: { buffer: colorBuffer, normalized: true, size: 3 },
        cls: { buffer: clsBuffer, normalized: false, size: 1 },
        sigma: { buffer: sigmaBuffer, normalized: true, size: 1 }
      },
      uniforms: {
        view: regl.prop("view"), proj: regl.prop("proj"),
        bboxMin, bboxSpan,
        mode: regl.prop("mode"),
        zRange: cloud.zRange, sigmaRange: cloud.sigmaRange,
        pointSize: regl.prop("pointSize"), worldSize: POINT_WORLD_SIZE,
        projScale: regl.prop("projScale"), pixelsPerMeter: regl.prop("pixelsPerMeter"), isPlan: regl.prop("isPlan"),
        ramp, classTex,
        fogNear: regl.prop("fogNear"), fogFar: regl.prop("fogFar"),
        background: BACKGROUND.slice(0, 3)
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
      primitive: "line strip",
      depth: { enable: false }
    });

    let drawOrtho = null;
    if (opts.ortho && opts.ortho.src && Array.isArray(opts.ortho.extent)) {
      const e = opts.ortho.extent; // [xmin, xmax, ymin, ymax]
      const z = Number.isFinite(opts.ortho.z) ? opts.ortho.z : bbox[4];
      const image = new Image();
      image.onload = () => {
        if (state.disposed) return;
        const texture = regl.texture({ data: image, flipY: true, min: "linear", mag: "linear" });
        drawOrtho = regl({
          vert: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 view, proj; varying vec2 vUv;
            void main() { vUv = uv; gl_Position = proj * view * vec4(position, 1.0); }`,
          frag: `precision highp float; varying vec2 vUv; uniform sampler2D tex;
            void main() { vec4 c = texture2D(tex, vUv); if (c.a < 0.05) discard; gl_FragColor = vec4(c.rgb, 1.0); }`,
          attributes: {
            position: [[e[0], e[2], z], [e[1], e[2], z], [e[1], e[3], z], [e[0], e[2], z], [e[1], e[3], z], [e[0], e[3], z]],
            uv: [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]
          },
          uniforms: { view: regl.prop("view"), proj: regl.prop("proj"), tex: texture },
          count: 6,
          depth: { enable: true, mask: false }
        });
        requestDraw();
      };
      image.src = opts.ortho.src;
    }

    const track = Array.isArray(opts.track) && opts.track.length > 1 ? opts.track.map((p) => [+p[0], +p[1], +p[2]]) : null;

    // ---- overlay controls ----
    const top = host.append("div").attr("class", "myIO-pc-top");
    const modes = top.append("div").attr("class", "myIO-pc-seg").attr("role", "group").attr("aria-label", "View");
    const modeButtons = modes.selectAll("button").data([["plan", "2D"], ["3d", "3D"]]).join("button")
      .attr("type", "button").text((d) => d[1])
      .on("click", (event, d) => { if (d[0] !== state.view.mode) { state.view = initialView(fitBox, d[0], aspect(), cloud.fitPoints); moved = false; } syncControls(); requestDraw(); });
    const hint = top.append("div").attr("class", "myIO-pc-hint");

    const bottom = host.append("div").attr("class", "myIO-pc-bottom");
    const caption = opts.caption;
    if (caption && (caption.shape || caption.map)) {
      const card = bottom.append("div").attr("class", "myIO-pc-card");
      const figure = (label, value, note) => {
        if (!value) return;
        const f = card.append("div").attr("class", "myIO-pc-figure");
        f.append("div").attr("class", "myIO-pc-figure-label").text(label);
        f.append("div").attr("class", "myIO-pc-figure-value").text(value);
        if (note) f.append("div").attr("class", "myIO-pc-figure-note").text(note);
      };
      figure("Shape accuracy", caption.shape, caption.shapeNote);
      figure("Map position", caption.map, caption.mapNote);
    }
    const legend = bottom.append("div").attr("class", "myIO-pc-legend");
    const chips = bottom.append("div").attr("class", "myIO-pc-chips");
    const available = COLOR_MODES.filter((m) => (m === "rgb" ? !!cloud.rgb : m === "class" ? !!cloud.cls : m === "sigma" ? !!cloud.sigma : true));
    const colorChips = chips.selectAll("button.myIO-pc-chip-color").data(available).join("button")
      .attr("type", "button").attr("class", "myIO-pc-chip myIO-pc-chip-color").text((d) => COLOR_LABELS[d])
      .on("click", (event, d) => { state.color = d; syncControls(); requestDraw(); });
    const orthoChip = opts.ortho ? chips.append("button").attr("type", "button").attr("class", "myIO-pc-chip myIO-pc-chip-ortho").text("Ortho")
      .on("click", () => { state.ortho = !state.ortho; syncControls(); requestDraw(); }) : null;
    const scale = host.append("div").attr("class", "myIO-pc-scale");

    function syncControls() {
      modeButtons.classed("is-on", (d) => d[0] === state.view.mode).attr("aria-pressed", (d) => String(d[0] === state.view.mode));
      colorChips.classed("is-on", (d) => d === state.color).attr("aria-pressed", (d) => String(d === state.color));
      if (orthoChip) orthoChip.classed("is-on", state.ortho).attr("aria-pressed", String(state.ortho));
      hint.text(state.view.mode === "plan" ? "Drag to pan · scroll or pinch to zoom" : "Drag to rotate · shift-drag to pan · scroll or pinch to zoom");
      legend.selectAll("*").remove();
      if (state.color === "class") {
        const names = opts.classNames || {};
        const colors = opts.classColors || {};
        cloud.classes.forEach((code) => {
          const item = legend.append("span").attr("class", "myIO-pc-legend-item");
          item.append("i").style("background", colors[code] || "#999");
          item.append("span").text(names[code] || "Class " + code);
        });
      } else if (state.color === "height" || state.color === "sigma") {
        const range = state.color === "height"
          ? cloud.zRange.map((t) => bbox[4] + t * (bbox[5] - bbox[4]))
          : cloud.sigmaRange.map((t) => sigmaFromByte(t * 255));
        const fmt = state.color === "height" ? (v) => v.toFixed(1) + " m" : (v) => (v < 1 ? (v * 100).toFixed(1) + " cm" : v.toFixed(2) + " m");
        legend.append("span").attr("class", "myIO-pc-legend-label").text(state.color === "height" ? "Height" : "Sigma");
        legend.append("span").text(fmt(range[0]));
        legend.append("i").attr("class", "myIO-pc-ramp");
        legend.append("span").text(fmt(range[1]));
      }
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
      regl.clear({ color: BACKGROUND, depth: 1 });
      const m = viewMatrices(state.view, w, h);
      const isPlan = state.view.mode === "plan";
      const dpr = canvas.width / Math.max(1, canvas.clientWidth || canvas.width);
      if (drawOrtho && state.ortho) drawOrtho({ view: m.view, proj: m.proj });
      drawPoints({
        view: m.view, proj: m.proj,
        mode: COLOR_MODES.indexOf(state.color),
        pointSize: (opts.pointSize > 0 ? opts.pointSize : 2) * dpr,
        projScale: m.projScale || 1, pixelsPerMeter: m.pixelsPerMeter || 1, isPlan: isPlan ? 1 : 0,
        fogNear: state.view.dist * 0.6, fogFar: state.view.dist * 1.8
      });
      if (track) drawLines({ view: m.view, proj: m.proj, position: track, count: track.length, color: [0.11, 0.14, 0.19, 1] });
      if (isPlan) {
        const ppm = (m.pixelsPerMeter || 1) / dpr;
        const target = 90 / ppm;
        const pow = Math.pow(10, Math.floor(Math.log10(target)));
        const nice = [1, 2, 5, 10].map((k) => k * pow).filter((v) => v <= target).pop() || pow;
        scale.style("display", null).style("width", Math.round(nice * ppm) + "px").text(nice >= 1 ? nice + " m" : Math.round(nice * 100) + " cm");
      } else {
        scale.style("display", "none");
      }
      canvas.dataset.frames = String((+canvas.dataset.frames || 0) + 1);
    }

    // ---- interaction ----
    const pointers = new Map();
    let pinch = null;
    canvasSel
      .on("contextmenu", (event) => event.preventDefault())
      .on("pointerdown", (event) => {
        canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 2 });
        if (pointers.size === 2) {
          const [a, b] = Array.from(pointers.values());
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), view: state.view };
        }
      })
      .on("pointermove", (event) => {
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
        pointers.delete(event.pointerId);
        if (pointers.size < 2) pinch = null;
      })
      .on("wheel", (event) => {
        event.preventDefault();
        moved = true;
        state.view = zoomView(state.view, Math.exp(event.deltaY * 0.0015));
        requestDraw();
      })
      .on("dblclick", () => { state.view = initialView(fitBox, state.view.mode, aspect(), cloud.fitPoints); moved = false; requestDraw(); });

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
    api.draw = draw;
    api.getView = () => state.view;
  }
}
