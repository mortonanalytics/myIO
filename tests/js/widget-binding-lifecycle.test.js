import { readFileSync } from "node:fs";
import { beforeEach, expect, test, vi } from "vitest";

const binding = readFileSync("inst/htmlwidgets/myIO.js", "utf8");
let definition, coord, subscribers, adapters;
beforeEach(() => {
  document.body.innerHTML = '<div id="widget"></div>';
  subscribers = new Set(); adapters = [];
  coord = {
    unregister: vi.fn(), register: vi.fn(), registerSource: vi.fn(),
    subscribe: vi.fn((id, fn) => { subscribers.add(fn); return () => subscribers.delete(fn); })
  };
  window.myIO = {
    bootCoordinator: () => coord, getCoordinator: () => coord,
    CrosstalkAdapter: class {
      constructor(options) { this.options = options; adapters.push(this); }
      attach() {} destroy() {} broadcast() {}
    }
  };
  const widgets = { widget: (value) => { definition = value; }, shinyMode: false };
  class Chart {
    constructor() { this.listeners = {}; this.resize = vi.fn(); }
    on(event, fn) { this.listeners[event] = fn; }
    destroy() { this.listeners.destroy?.(); }
  }
  const d3 = { select: () => ({ selectAll: () => ({ remove() {} }) }) };
  new Function("HTMLWidgets", "myIOchart", "d3", binding)(widgets, Chart, d3);
});
function payload(group = "shared-group") {
  return { config: { layers: [], specVersion: 2, coordinator_enabled: true, engine: "svg" },
    bigdata: { mode: "inline_ipc", source_id: "source" }, coordinator: { chart_id: "chart" }, crosstalk: { group } };
}
test.each(["shared-group", ["shared-group"]])("preserves Crosstalk group %j", (group) => {
  const widget = definition.factory(document.getElementById("widget"), 600, 400);
  widget.renderValue(payload(group));
  expect(adapters[0].options.group).toBe("shared-group");
});
test("rerender releases previous coordinator subscriptions", () => {
  const widget = definition.factory(document.getElementById("widget"), 600, 400);
  widget.renderValue(payload()); widget.renderValue(payload());
  expect(subscribers.size).toBe(1);
  coord.unregister.mockClear();
  widget.myIOchart.destroy();
  expect(subscribers.size).toBe(0);
  expect(coord.unregister).toHaveBeenLastCalledWith("chart");
  expect(widget._myIO_chartId).toBeNull();
});
test("temporary zero size retains coordinator registration", () => {
  const widget = definition.factory(document.getElementById("widget"), 600, 400);
  widget.renderValue(payload());
  coord.unregister.mockClear();
  widget.resize(0, 0); widget.resize(600, 400);
  expect(coord.unregister).not.toHaveBeenCalled();
  expect(widget._myIO_chartId).toBe("chart");
});
