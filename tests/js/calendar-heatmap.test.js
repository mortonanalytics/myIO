import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { CalendarHeatmapRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/CalendarHeatmapRenderer.js";
import {
  registerBuiltInRenderers,
  getRenderer
} from "../../inst/htmlwidgets/myIO/src/registry.js";
import {
  registerLinkedCursor,
  maybeEmitCursor,
  _registry as cursorRegistry
} from "../../inst/htmlwidgets/myIO/src/interactions/linked-cursor.js";

// Vitest/jsdom needs d3 on globalThis for renderer internals
globalThis.d3 = d3;

function mountChart(dataRows, opts) {
  opts = opts || {};
  var container = document.createElement("div");
  container.id = opts.id || "cal-" + Math.random().toString(36).slice(2, 8);
  document.body.appendChild(container);
  var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svgNode);
  var svg = d3.select(svgNode);
  var plot = svg.append("g").attr("class", "myIO-chart-offset");
  var chartArea = plot.append("g").attr("class", "myIO-chart-area");
  return {
    element: container,
    svg: svg,
    plot: plot,
    chart: chartArea,
    width: 800,
    height: 220,
    margin: { top: 30, right: 20, bottom: 20, left: 30 },
    config: { interactions: {}, axis: {} },
    options: { transition: { speed: 0 } },
    derived: {},
    runtime: {},
    _layer: {
      type: "calendarHeatmap",
      label: opts.label || "activity",
      color: opts.color || "#4E79A7",
      options: {
        weekStart: opts.weekStart || "sunday",
        showWeekdayLabels: opts.showWeekdayLabels !== false
      },
      data: dataRows,
      mapping: { date: "d", value: "v" }
    }
  };
}

function fullYear(year) {
  var rows = [];
  var d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    rows.push({
      d: d.toISOString().slice(0, 10),
      v: Math.floor(Math.random() * 10)
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return rows;
}

describe("CalendarHeatmapRenderer", function() {
  beforeEach(function() {
    document.body.innerHTML = "";
    cursorRegistry.clear();
  });

  test("AC-J1: registered under type 'calendarHeatmap'", function() {
    registerBuiltInRenderers();
    var renderer = getRenderer("calendarHeatmap");
    expect(renderer).toBeDefined();
    expect(renderer.constructor.type).toBe("calendarHeatmap");
    expect(renderer.constructor.traits.hasAxes).toBe(false);
    expect(renderer.constructor.traits.legendType).toBe("continuous");
  });

  test("AC-J2: 365 cells for full 2026", function() {
    var ch = mountChart(fullYear(2026));
    new CalendarHeatmapRenderer().render(ch, ch._layer);
    var cells = ch.element.querySelectorAll("rect.myIO-calendar-cell");
    expect(cells.length).toBe(365);
  });

  test("AC-J3: Sunday-start puts 2026-01-04 on row 0 and 2026-01-03 on row 6", function() {
    var rows = [
      { d: "2026-01-03", v: 1 },
      { d: "2026-01-04", v: 1 }
    ];
    var ch = mountChart(rows);
    new CalendarHeatmapRenderer().render(ch, ch._layer);
    var sunday = ch.element.querySelector('rect.myIO-calendar-cell[data-date="2026-01-04"]');
    var saturday = ch.element.querySelector('rect.myIO-calendar-cell[data-date="2026-01-03"]');
    expect(sunday.getAttribute("data-row")).toBe("0");
    expect(saturday.getAttribute("data-row")).toBe("6");
  });

  test("AC-J4: Monday-start puts 2026-01-05 on row 0 and 2026-01-04 on row 6", function() {
    var rows = [
      { d: "2026-01-04", v: 1 },
      { d: "2026-01-05", v: 1 }
    ];
    var ch = mountChart(rows, { weekStart: "monday" });
    new CalendarHeatmapRenderer().render(ch, ch._layer);
    var monday = ch.element.querySelector('rect.myIO-calendar-cell[data-date="2026-01-05"]');
    var sunday = ch.element.querySelector('rect.myIO-calendar-cell[data-date="2026-01-04"]');
    expect(monday.getAttribute("data-row")).toBe("0");
    expect(sunday.getAttribute("data-row")).toBe("6");
  });

  test("AC-J5: color scale maps zero to empty-fill and max to layer color", function() {
    var rows = [
      { d: "2026-06-01", v: 0 },
      { d: "2026-06-02", v: 5 },
      { d: "2026-06-03", v: 10 }
    ];
    var ch = mountChart(rows, { color: "#4E79A7" });
    new CalendarHeatmapRenderer().render(ch, ch._layer);
    var fillOf = function(iso) {
      return ch.element.querySelector(
        'rect.myIO-calendar-cell[data-date="' + iso + '"]'
      ).getAttribute("fill");
    };
    expect(fillOf("2026-06-01")).toMatch(/var\(--chart-calendar-empty-fill|#ebedf0/);
    var high = fillOf("2026-06-03").toLowerCase();
    expect(high).toMatch(/#4e79a7|rgb\(78,\s*121,\s*167\)/);
  });

  test("AC-J6: 12 month labels for full year", function() {
    var ch = mountChart(fullYear(2026));
    new CalendarHeatmapRenderer().render(ch, ch._layer);
    var labels = ch.element.querySelectorAll("text.myIO-calendar-month");
    expect(labels.length).toBe(12);
    var texts = Array.from(labels).map(function(l) { return l.textContent; });
    expect(texts).toEqual(
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    );
  });

  test("AC-J7: formatTooltip produces 'Apr 18, 2026'", function() {
    var r = new CalendarHeatmapRenderer();
    var chart = { runtime: {} };
    var layer = {
      mapping: { date: "d", value: "v" },
      color: "#4E79A7",
      label: "activity"
    };
    var datum = {
      d: "2026-04-18",
      v: 42,
      date: new Date("2026-04-18T00:00:00Z"),
      value: 42,
      color: "#4E79A7",
      label: "activity"
    };
    var out = r.formatTooltip(chart, datum, layer);
    var titleText = typeof out.title === "string" ? out.title : out.title.text;
    expect(titleText).toMatch(/Apr\s+18,\s+2026/);
    expect(out.value).toBe(42);
  });

  test("AC-J8: maybeEmitCursor emits Date xValue across two linked calendars", function() {
    var a = mountChart(fullYear(2026), { id: "A" });
    var b = mountChart(fullYear(2026), { id: "B" });
    a.config.interactions.linked = { enabled: true, group: "g1", cursor: true, keyColumn: "d" };
    b.config.interactions.linked = { enabled: true, group: "g1", cursor: true, keyColumn: "d" };
    new CalendarHeatmapRenderer().render(a, a._layer);
    new CalendarHeatmapRenderer().render(b, b._layer);
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    var row = { d: "2026-04-18", v: 42 };
    maybeEmitCursor(a, row, new Date("2026-04-18T00:00:00Z"), null);

    var received = b.runtime._linkedCursor.lastPayload;
    expect(received).toBeDefined();
    expect(received.sourceId).toBe("A");
    expect(received.keyValue).toBe("2026-04-18");
    expect(received.xValue instanceof Date).toBe(true);
    expect(received.xValue.toISOString().slice(0, 10)).toBe("2026-04-18");
  });

  test("AC-J9: receiver draws hover rule inside plot group at correct week column", function() {
    var a = mountChart(fullYear(2026), { id: "A" });
    var b = mountChart(fullYear(2026), { id: "B" });
    a.config.interactions.linked = { enabled: true, group: "g1", cursor: true, keyColumn: "d" };
    b.config.interactions.linked = { enabled: true, group: "g1", cursor: true, keyColumn: "d" };
    new CalendarHeatmapRenderer().render(a, a._layer);
    new CalendarHeatmapRenderer().render(b, b._layer);
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    var targetIso = "2026-04-18";
    var row = { d: targetIso, v: 1 };
    maybeEmitCursor(a, row, new Date(targetIso + "T00:00:00Z"), null);

    var rule = b.element.querySelector("line.myIO-hover-rule");
    expect(rule).not.toBeNull();
    expect(rule.parentNode.getAttribute("class")).toBe("myIO-chart-offset");
    var targetCell = b.element.querySelector(
      'rect.myIO-calendar-cell[data-date="' + targetIso + '"]'
    );
    var expectedX = Number(targetCell.getAttribute("x"));
    expect(Number(rule.getAttribute("x1"))).toBeCloseTo(expectedX, 0);
  });
});
