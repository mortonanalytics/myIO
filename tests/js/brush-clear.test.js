import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { bindBrush } from "../../inst/htmlwidgets/myIO/src/interactions/brush.js";

globalThis.d3 = d3;

var ROWS = [
  { x: 1, y: 1, _source_key: "row_1" },
  { x: 2, y: 2, _source_key: "row_2" },
  { x: 8, y: 8, _source_key: "row_3" }
];

function buildChart() {
  document.body.innerHTML = "<div id='brush-chart'></div>";
  var element = document.getElementById("brush-chart");
  var svg = d3.select(element).append("svg");
  var chartArea = svg.append("g");
  var layer = { type: "point", label: "pts", data: ROWS, mapping: { x_var: "x", y_var: "y" } };
  var emitted = [];

  return {
    emitted: emitted,
    element: element,
    config: {
      interactions: { brush: { enabled: true, direction: "xy" } },
      layout: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
    },
    derived: { currentLayers: [layer] },
    dom: { element: element, chartArea: chartArea },
    runtime: { width: 200, height: 200 },
    xScale: d3.scaleLinear().domain([0, 10]).range([0, 200]),
    yScale: d3.scaleLinear().domain([0, 10]).range([200, 0]),
    emit: function(name, payload) { emitted.push({ name: name, payload: payload }); }
  };
}

function moveBrush(chart, selection) {
  chart.dom.chartArea.select(".myIO-brush").call(chart.runtime._brushFn.move, selection);
}

function brushedEvents(chart) {
  return chart.emitted.filter(function(e) { return e.name === "brushed"; });
}

describe("clearing a brush", function() {
  var chart;

  beforeEach(function() {
    chart = buildChart();
    bindBrush(chart);
  });

  // Moving the brush to null re-dispatches d3's "end" event with no selection,
  // which re-enters clearBrush. Unguarded that recursed until the stack blew.
  test("does not recurse when the brush is moved to null", function() {
    moveBrush(chart, [[0, 100], [100, 200]]);
    expect(function() { moveBrush(chart, null); }).not.toThrow();
  });

  test("resets the stored selection", function() {
    moveBrush(chart, [[0, 100], [100, 200]]);
    expect(chart.runtime._brushed.keys.length).toBeGreaterThan(0);

    moveBrush(chart, null);
    expect(chart.runtime._brushed).toBe(null);
  });

  // Linked target charts restore their opacity off this event. Before the fix
  // the stack overflow unwound past the emit, so targets stayed dimmed.
  test("emits an empty brushed event so linked targets can reset", function() {
    moveBrush(chart, [[0, 100], [100, 200]]);
    moveBrush(chart, null);

    var last = brushedEvents(chart).pop();
    expect(last.payload.keys).toEqual([]);
    expect(last.payload.data).toEqual([]);
    expect(last.payload.extent).toBe(null);
  });

  test("restores full opacity on the brushed marks", function() {
    chart.dom.chartArea
      .selectAll("circle")
      .data(ROWS)
      .enter()
      .append("circle")
      .attr("class", "tag-point-brush-chart-pts");

    moveBrush(chart, [[0, 100], [100, 200]]);
    moveBrush(chart, null);

    var opacities = chart.dom.chartArea.selectAll("circle").nodes().map(function(n) {
      return n.style.opacity;
    });
    expect(opacities).toEqual(["1", "1", "1"]);
  });

  test("emits exactly one clear event per clear", function() {
    moveBrush(chart, [[0, 100], [100, 200]]);
    var before = brushedEvents(chart).length;

    moveBrush(chart, null);

    expect(brushedEvents(chart).length).toBe(before + 1);
  });
});
