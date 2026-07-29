import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  initializeKeyframes,
  selectKeyframe,
  stepKeyframe,
  toggleKeyframePlayback,
  destroyKeyframes
} from "../../inst/htmlwidgets/myIO/src/interactions/keyframes.js";

function chartWithFrames(speed = 0) {
  document.body.innerHTML = '<div id="chart"></div>';
  const chart = {
    dom: { element: document.getElementById("chart") },
    config: {
      transitions: { speed },
      layers: [
        { label: "a", data: [{ x: 0 }] },
        { label: "b", data: [{ x: 10 }] }
      ],
      keyframes: [
        { label: "Start", layers: [{ label: "a", data: [{ x: 1 }] }, { label: "b", data: [{ x: 10 }] }] },
        { label: "Middle", layers: [{ label: "a", data: [{ x: 2 }] }, { label: "b", data: [{ x: 20 }] }] },
        { label: "End", layers: [{ label: "a", data: [{ x: 3 }] }, { label: "b", data: [{ x: 30 }] }] }
      ]
    },
    runtime: {},
    updateData: vi.fn(function(updates) {
      updates.forEach((update) => {
        const layer = chart.config.layers.find((candidate) => candidate.label === update.label);
        if (layer) layer.data = update.data;
      });
    })
  };
  return chart;
}

describe("keyframe controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("initializes the first frame and renders accessible controls", () => {
    const chart = chartWithFrames();
    initializeKeyframes(chart);

    expect(chart.runtime.keyframeIndex).toBe(0);
    expect(chart.config.layers[0].data).toEqual([{ x: 1 }]);
    expect(document.querySelector(".myIO-keyframe-label").textContent).toBe("Start");
    expect(document.querySelectorAll(".myIO-keyframe-button")).toHaveLength(3);
    expect(document.querySelector(".myIO-keyframe-controls").getAttribute("aria-label"))
      .toBe("Keyframe playback controls");
  });

  test("initializes object-shaped treemap frame data", () => {
    const chart = chartWithFrames();
    chart.config.layers = [{ label: "tree", type: "treemap", data: { name: "old" } }];
    chart.config.keyframes = [{
      label: "Tree",
      layers: [{ label: "tree", data: { name: "root", children: [{ name: "A" }] } }]
    }];
    initializeKeyframes(chart);

    expect(chart.config.layers[0].data).toEqual({
      name: "root", children: [{ name: "A" }]
    });
  });

  test("selects by label or one-based index and clamps steps", () => {
    const chart = chartWithFrames();
    initializeKeyframes(chart);

    expect(selectKeyframe(chart, "End")).toBe(true);
    expect(chart.runtime.keyframeIndex).toBe(2);
    expect(selectKeyframe(chart, 2)).toBe(true);
    expect(chart.runtime.keyframeIndex).toBe(1);
    stepKeyframe(chart, "previous");
    stepKeyframe(chart, "previous");
    expect(chart.runtime.keyframeIndex).toBe(0);
    stepKeyframe(chart, "next");
    expect(chart.runtime.keyframeIndex).toBe(1);
    expect(selectKeyframe(chart, "missing")).toBe(false);
  });

  test("plays once, stops at the end, and restarts from the end", () => {
    const chart = chartWithFrames(200);
    initializeKeyframes(chart);
    toggleKeyframePlayback(chart);
    expect(chart.runtime.keyframePlaying).toBe(true);

    vi.advanceTimersByTime(1200);
    expect(chart.runtime.keyframeIndex).toBe(1);
    vi.advanceTimersByTime(1200);
    expect(chart.runtime.keyframeIndex).toBe(2);
    expect(chart.runtime.keyframePlaying).toBe(false);

    toggleKeyframePlayback(chart);
    expect(chart.runtime.keyframeIndex).toBe(0);
    expect(chart.runtime.keyframePlaying).toBe(true);
  });

  test("pause and destroy clear playback timers", () => {
    const chart = chartWithFrames();
    initializeKeyframes(chart);
    toggleKeyframePlayback(chart);
    toggleKeyframePlayback(chart);
    vi.advanceTimersByTime(5000);
    expect(chart.runtime.keyframeIndex).toBe(0);

    toggleKeyframePlayback(chart);
    destroyKeyframes(chart);
    expect(document.querySelector(".myIO-keyframe-controls")).toBeNull();
    expect(chart.runtime.keyframeTimer).toBeNull();
  });

  test("reinitializing clears playback and preserves unrelated runtime state", () => {
    const chart = chartWithFrames();
    chart.runtime.brushState = { active: true };
    chart.runtime.zoomState = { k: 2 };
    initializeKeyframes(chart);
    toggleKeyframePlayback(chart);
    initializeKeyframes(chart);
    vi.advanceTimersByTime(5000);

    expect(chart.runtime.keyframePlaying).toBe(false);
    expect(chart.runtime.keyframeTimer).toBeNull();
    expect(chart.runtime.keyframeIndex).toBe(0);
    expect(chart.runtime.brushState).toEqual({ active: true });
    expect(chart.runtime.zoomState).toEqual({ k: 2 });
  });

  test("does nothing for zero or one frame", () => {
    const chart = chartWithFrames();
    chart.config.keyframes = [];
    initializeKeyframes(chart);
    expect(document.querySelector(".myIO-keyframe-controls")).toBeNull();

    chart.config.keyframes = [{ label: "Only", layers: [] }];
    initializeKeyframes(chart);
    expect(document.querySelector(".myIO-keyframe-controls")).toBeNull();
  });

  test("malformed selections and steps are safe no-ops", () => {
    const chart = chartWithFrames();
    initializeKeyframes(chart);

    expect(selectKeyframe(chart, null)).toBe(false);
    expect(selectKeyframe(chart, 0)).toBe(false);
    expect(selectKeyframe(chart, 1.5)).toBe(false);
    expect(stepKeyframe(chart, "sideways")).toBe(false);
    expect(chart.runtime.keyframeIndex).toBe(0);
  });
});
