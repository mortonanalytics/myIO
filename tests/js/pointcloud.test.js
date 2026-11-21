import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import {
  BAND_DARK, BAND_LIFT, BAND_LIGHT, PointCloudRenderer, buildDrape, buildMesh, buildRibbon, clipProfile, cutDepth, decodeCloud, decodeTerrain,
  dragView, initialView, isCutAway, keysInRect, lookAt, onTrack, perspective, scaleInk, sigmaFromByte, trackLengths, viewMatrices, zoomView
} from "../../inst/htmlwidgets/myIO/src/renderers/PointCloudRenderer.js";
import { getRenderer, registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";
import { validateComposition } from "../../inst/htmlwidgets/myIO/src/derive/validate.js";

globalThis.d3 = d3;

function b64(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

function payload() {
  // Three points at the bbox corners and center.
  const positions = new Uint16Array([0, 0, 0, 65535, 65535, 65535, 32768, 32768, 32768]);
  return {
    n: 3,
    bbox: [0, 10, 0, 20, 0, 2],
    positions: b64(positions),
    rgb: b64(new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255])),
    cls: b64(new Uint8Array([2, 6, 2])),
    sigma: b64(new Uint8Array([64, 128, 192]))
  };
}

function apply(m, p) {
  const v = [0, 1, 2, 3].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r]);
  return v;
}

describe("pointcloud", function() {
  test("the 2D scale bar takes the ink that contrasts with the plan background", function() {
    expect(scaleInk([0.969, 0.973, 0.98, 1])).toBe("#1d2430");
    expect(scaleInk([1, 1, 1, 1])).toBe("#1d2430");
    expect(scaleInk([26 / 255, 26 / 255, 46 / 255, 1])).toBe("#f3f4f6");
    expect(scaleInk([0, 0, 0, 1])).toBe("#f3f4f6");
  });

  beforeEach(function() {
    document.body.innerHTML = "";
  });

  test("is a registered standalone type that cannot share a chart", function() {
    registerBuiltInRenderers();
    expect(getRenderer("pointcloud").constructor.traits.hasAxes).toBe(false);
    expect(validateComposition([{ type: "pointcloud" }, { type: "point" }]).valid).toBe(false);
  });

  test("decodes the packed arrays and finds the classes present", function() {
    const cloud = decodeCloud(payload());
    expect(cloud.n).toBe(3);
    expect(Array.from(cloud.positions)).toEqual([0, 0, 0, 65535, 65535, 65535, 32768, 32768, 32768]);
    expect(Array.from(cloud.rgb.slice(0, 3))).toEqual([255, 0, 0]);
    expect(cloud.classes).toEqual([2, 6]);
    expect(cloud.zRange[0]).toBeLessThanOrEqual(cloud.zRange[1]);
  });

  test("sigma bytes map back to meters on the 1 mm to 10 m log scale", function() {
    expect(sigmaFromByte(0)).toBeCloseTo(0.001, 6);
    expect(sigmaFromByte(255)).toBeCloseTo(10, 6);
    expect(sigmaFromByte(255 * 0.25)).toBeCloseTo(0.01, 6);
  });

  test("the plan view frames the whole footprint in a narrow or wide canvas", function() {
    const bbox = [0, 10, 0, 20, 0, 2];
    [0.5, 2].forEach(function(aspect) {
      const view = initialView(bbox, "plan", aspect);
      const m = viewMatrices(view, 200 * aspect, 200);
      [[0, 0, 0], [10, 20, 0], [0, 20, 0], [10, 0, 0]].forEach(function(p) {
        const clip = apply(m.proj, apply(m.view, p));
        expect(Math.abs(clip[0] / clip[3])).toBeLessThanOrEqual(1);
        expect(Math.abs(clip[1] / clip[3])).toBeLessThanOrEqual(1);
      });
    });
  });

  test("the 3D view fits the box: every corner inside the canvas, the widest close to its edge", function() {
    const box = [0, 10, 0, 20, 0, 2];
    [0.6, 1.6].forEach(function(aspect) {
      const view = initialView(box, "3d", aspect);
      const m = viewMatrices(view, 300 * aspect, 300);
      let widest = 0;
      for (let i = 0; i < 8; i++) {
        const c = apply(m.proj, apply(m.view, [box[i & 1 ? 1 : 0], box[i & 2 ? 3 : 2], box[i & 4 ? 5 : 4]]));
        const nx = Math.abs(c[0] / c[3]), ny = Math.abs(c[1] / c[3]);
        expect(nx).toBeLessThanOrEqual(0.95);
        expect(ny).toBeLessThanOrEqual(0.95);
        widest = Math.max(widest, nx, ny);
      }
      expect(widest).toBeGreaterThan(0.85);
      expect(view.el).toBeGreaterThan(0.3);
      expect(view.el).toBeLessThan(1.2);
    });
  });

  test("fitting to the points themselves fills the canvas and centres an L-shaped cloud", function() {
    const pts = [];
    for (let i = 0; i <= 50; i++) { pts.push([i * 0.2, 0, 0]); pts.push([0, i * 0.4, 0]); }
    const box = [0, 10, 0, 20, 0, 0.5];
    const view = initialView(box, "3d", 1.5, pts);
    const m = viewMatrices(view, 150, 100);
    const q = pts.map((p) => { const c = apply(m.proj, apply(m.view, p)); return [c[0] / c[3], c[1] / c[3]]; });
    const xs = q.map((c) => c[0]), ys = q.map((c) => c[1]);
    const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
    expect(Math.max(spanX, spanY)).toBeGreaterThan(1.7);
    // Centred to within a few percent of the canvas (perspective makes the pan
    // approximate).
    expect(Math.abs(Math.max(...xs) + Math.min(...xs))).toBeLessThan(0.15);
    expect(Math.abs(Math.max(...ys) + Math.min(...ys))).toBeLessThan(0.15);
  });

  test("decode keeps a box of the middle 98% of points on each axis", function() {
    const n = 1000, pos = new Uint16Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = Math.round(i / (n - 1) * 65535); pos[i * 3 + 1] = 32768; pos[i * 3 + 2] = 0; }
    const cloud = decodeCloud({ n, bbox: [0, 100, 0, 10, 0, 1], positions: b64(pos) });
    expect(cloud.box[0]).toBeGreaterThan(0.5);
    expect(cloud.box[1]).toBeLessThan(99.5);
    expect(cloud.box[0]).toBeLessThan(2);
  });

  test("the 3D view looks at the cloud's center from above", function() {
    const view = initialView([0, 10, 0, 20, 0, 2], "3d", 1.5);
    const m = viewMatrices(view, 300, 200);
    expect(m.eye[2]).toBeGreaterThan(view.target[2]);
    const center = apply(m.proj, apply(m.view, view.target));
    expect(center[0] / center[3]).toBeCloseTo(0, 6);
    expect(center[1] / center[3]).toBeCloseTo(0, 6);
  });

  test("dragging orbits in 3D, pans in plan, and zoom scales the view", function() {
    const view3d = initialView([0, 10, 0, 20, 0, 2], "3d", 1.5);
    const orbited = dragView(view3d, 50, 0, 300, 200, false);
    expect(orbited.az).not.toBe(view3d.az);
    expect(orbited.target).toEqual(view3d.target);
    const panned3d = dragView(view3d, 50, 0, 300, 200, true);
    expect(panned3d.az).toBe(view3d.az);
    expect(panned3d.target).not.toEqual(view3d.target);

    const plan = initialView([0, 10, 0, 20, 0, 2], "plan", 1.5);
    const moved = dragView(plan, 100, 0, 300, 200, false);
    expect(moved.target[0]).toBeLessThan(plan.target[0]);
    expect(zoomView(plan, 0.5).halfH).toBeCloseTo(plan.halfH / 2);
    expect(zoomView(view3d, 2).dist).toBeCloseTo(view3d.dist * 2);
  });

  test("lookAt and perspective put a point in front of the camera inside the frustum", function() {
    const v = lookAt([0, -10, 5], [0, 0, 0], [0, 0, 1]);
    const p = perspective(Math.PI / 4, 1.5, 0.1, 100);
    const clip = apply(p, apply(v, [0, 0, 0]));
    expect(clip[3]).toBeGreaterThan(0);
    expect(Math.abs(clip[2] / clip[3])).toBeLessThan(1);
  });

  test("says so when the browser has no WebGL", async function() {
    const container = document.createElement("div");
    container.id = "pc";
    document.body.appendChild(container);
    const svg = d3.select(container).append("svg");
    const area = svg.append("g");
    const listeners = {};
    const chart = {
      element: container, width: 400, height: 300, margin: { top: 0, right: 0, bottom: 0, left: 0 },
      config: { layout: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      dom: { element: container, chartArea: area }, runtime: {},
      on: (name, fn) => { listeners[name] = fn; }, off: () => {}
    };
    new PointCloudRenderer().render(chart, { label: "cloud", options: payload() });
    await chart.runtime.pointcloud.ready;
    expect(container.querySelector(".myIO-pointcloud-message").textContent).toMatch(/WebGL is not available/);
    new PointCloudRenderer().remove(chart);
    expect(container.querySelector(".myIO-pointcloud")).toBeNull();
  });

  test("decodes the point source and counts camera points", function() {
    const opts = payload();
    opts.src = b64(new Uint8Array([0, 1, 0]));
    const cloud = decodeCloud(opts);
    expect(Array.from(cloud.src)).toEqual([0, 1, 0]);
    expect(cloud.cameraPoints).toBe(1);
  });

  test("drapes the orthophoto on the DEM: two triangles per complete grid square, uv over the image extent", function() {
    // 3 x 2 grid of 1 m cells from (0, 0); the top-right cell is empty.
    const z = new Float32Array([0, 1, 2, 0, 1, NaN]);
    const grid = decodeTerrain({ cols: 3, rows: 2, x0: 0, y0: 0, dx: 1, dy: 1, z: b64(z) });
    expect(grid.at(1.2, 0.1)).toBe(1);
    expect(Number.isNaN(grid.at(2, 1))).toBe(true);
    expect(Number.isNaN(grid.at(9, 9))).toBe(true);
    const drape = buildDrape(grid, [0, 2, 0, 1]);
    // Only the left square has four heights.
    expect(drape.count).toBe(6);
    expect(Array.from(drape.positions.slice(0, 3))).toEqual([0, 0, 0]);
    expect(Math.max(...drape.uv)).toBeLessThanOrEqual(1);
    expect(Math.min(...drape.uv)).toBeGreaterThanOrEqual(0);
  });

  test("expands the mesh to triangles with vertex colors and upward normals", function() {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1]);
    const mesh = buildMesh({ nv: 4, nf: 2, positions: b64(positions), colors: b64(new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 9, 9, 9])),
      faces: b64(new Uint32Array([0, 2, 1, 1, 2, 3])) });
    expect(mesh.count).toBe(6);
    expect(Array.from(mesh.colors.slice(0, 3))).toEqual([255, 0, 0]);
    // The first triangle lies flat; its normal points up whatever its winding.
    expect(Array.from(mesh.normals.slice(0, 3)).map((v) => v + 0)).toEqual([0, 0, 1]);
  });

  test("the track band runs light to dark orange with uncertainty and sits above the ground", function() {
    const path = [[0, 0, 1.5, 0], [1, 0, 1.5, 0.5], [2, 0, 1.5, 1]];
    const band = buildRibbon(path, 0.2, () => 10);
    expect(band.count).toBe(12);
    expect(band.positions[2]).toBeCloseTo(10 + BAND_LIFT);
    expect(Array.from(band.colors.slice(0, 3)).map((v) => +v.toFixed(3))).toEqual(BAND_LIGHT.map((v) => +v.toFixed(3)));
    const lastColor = Array.from(band.colors.slice(band.colors.length - 3)).map((v) => +v.toFixed(3));
    expect(lastColor).toEqual(BAND_DARK.map((v) => +v.toFixed(3)));
    // Across a gap in the ground the last known ground carries on.
    const gappy = buildRibbon(path, 0.2, (x) => (x < 0.5 ? 4 : NaN));
    expect(gappy.positions[gappy.positions.length - 1]).toBeCloseTo(4 + BAND_LIFT);
  });

  test("the select rectangle picks the selectable points inside it, either way round", function() {
    const selectable = { key: "point_id", ids: [1, 2, 3], x: [0, 5, 10], y: [0, 5, 10] };
    expect(keysInRect(selectable, [-1, 6, -1, 6])).toEqual([1, 2]);
    expect(keysInRect(selectable, [6, -1, 6, -1])).toEqual([1, 2]);
    expect(keysInRect(null, [0, 1, 0, 1])).toEqual([]);
  });

  test("the profile line is clipped to the DEM, or to the cloud's box without one", function() {
    // DEM covers x 2 to 6 along y = 0; the line runs from x = -10 to x = 20.
    const ground = (x) => (x >= 2 && x <= 6 ? 1 : NaN);
    const line = clipProfile([[-10, 0], [20, 0]], ground, [0, 10, -1, 1, 0, 3], 0.1, 300);
    expect(line[0][0]).toBeCloseTo(2, 1);
    expect(line[line.length - 1][0]).toBeCloseTo(6, 1);
    expect(line[0][2]).toBeCloseTo(1.1);
    const boxed = clipProfile([[-10, 0], [20, 0]], null, [0, 10, -1, 1, 0.5, 3], 0, 300);
    expect(boxed[0][0]).toBeCloseTo(0, 1);
    expect(boxed[boxed.length - 1][0]).toBeCloseTo(10, 1);
    expect(boxed[0][2]).toBe(0.5);
    expect(clipProfile([[50, 50], [60, 60]], ground, [0, 10, -1, 1, 0, 3], 0)).toBeNull();
  });

  test("the along-the-walk slider finds the track point by distance, not by vertex", function() {
    // 3 m east, then 1 m north: 4 m in all, the middle vertex at 75%.
    const track = [[0, 0, 1], [3, 0, 1], [3, 1, 1]];
    const lengths = trackLengths(track);
    expect(lengths).toEqual([0, 3, 4]);
    expect(onTrack(track, lengths, 0)).toEqual([0, 0, 1]);
    expect(onTrack(track, lengths, 0.5)).toEqual([2, 0, 1]);
    expect(onTrack(track, lengths, 0.75)).toEqual([3, 0, 1]);
    expect(onTrack(track, lengths, 0.875)).toEqual([3, 0.5, 1]);
    expect(onTrack(track, lengths, 1)).toEqual([3, 1, 1]);
    // A repeated vertex (zero-length span) does not divide by zero.
    const still = [[0, 0, 0], [0, 0, 0], [2, 0, 0]];
    expect(onTrack(still, trackLengths(still), 0.5)).toEqual([1, 0, 0]);
    // No length, or one point: no position.
    expect(onTrack([[1, 1, 1], [1, 1, 1]], [0, 0], 0.5)).toBeNull();
    expect(onTrack([[1, 1, 1]], [0], 0.5)).toBeNull();
  });

  test("a focused 3D view cuts away what is nearer than half the view's height in front of the focus", function() {
    const view = { mode: "3d", target: [0, 0, 0], dist: 10, az: 0, el: 0.5 };
    const halfH = 10 * Math.tan(Math.PI / 8);
    expect(cutDepth(view, 1.5)).toBeCloseTo(10 - halfH);
    // A tall canvas uses its width, as the app uses the smaller side.
    expect(cutDepth(view, 0.5)).toBeCloseTo(10 - halfH * 0.5);
    const cut = cutDepth(view, 1.5);
    expect(isCutAway(cut - 0.01, cut)).toBe(true);
    expect(isCutAway(cut + 0.01, cut)).toBe(false);
    // The focus itself and what lies behind it stay.
    expect(isCutAway(10, cut)).toBe(false);
    expect(isCutAway(20, cut)).toBe(false);
    // Unfocused (cut 0): nothing is cut.
    expect(isCutAway(0.001, 0)).toBe(false);
  });
});
