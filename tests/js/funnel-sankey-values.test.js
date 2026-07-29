import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import { beforeEach, describe, expect, test } from "vitest";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = Object.assign({}, d3, d3Sankey);

function makeFunnelChart(options) {
  document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
  var el = document.getElementById("chart");
  return {
    element: el,
    dom: { element: el, chartArea: d3.select(el).select(".myIO-chart-area") },
    derived: {},
    options: options || null,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    width: 360,
    height: 260
  };
}

function funnelLayer(extraOptions) {
  return {
    id: "funnel_1",
    label: "conversion",
    mapping: { stage: "stage", value: "value" },
    options: extraOptions || null,
    data: [
      { stage: "Visit", value: 100 },
      { stage: "Lead", value: 60 },
      { stage: "Won", value: 20 }
    ]
  };
}

function valueNodes() {
  return Array.from(document.querySelectorAll(".tag-funnel-funnel_1 .funnel-value"));
}

function makeSankeyChart() {
  document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
  var el = document.getElementById("chart");
  return {
    element: el,
    chart: d3.select(el).select(".myIO-chart-area"),
    dom: { element: el, chartArea: d3.select(el).select(".myIO-chart-area") },
    derived: {},
    options: { transition: { speed: 0 } },
    margin: { top: 30, bottom: 60, left: 50, right: 5 },
    width: 400,
    height: 300,
    colorDiscrete: null
  };
}

function sankeyLayer(extraOptions) {
  return {
    label: "flow",
    color: ["#ff0000", "#00ff00", "#0000ff"],
    mapping: { source: "source", target: "target", value: "value" },
    options: extraOptions || null,
    data: [
      { source: "A", target: "B", value: 2 },
      { source: "B", target: "C", value: 3 }
    ]
  };
}

describe("Funnel value labels", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("every stage renders its value and conversion percentage", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, funnelLayer());

    var texts = valueNodes().map(function(node) { return node.textContent; });
    expect(texts.length).toBe(3);
    expect(texts[0]).toBe("100 (100.0%)");
    expect(texts[1]).toBe("60 (60.0%)");
    expect(texts[2]).toBe("20 (20.0%)");
  });

  test("the value label honours the chart's y axis format", function() {
    var chart = makeFunnelChart({ transition: { speed: 0 }, yAxisFormat: "$,.0f" });
    getRenderer("funnel").render(chart, funnelLayer());

    expect(valueNodes()[0].textContent).toBe("$100 (100.0%)");
  });

  test("the value label moves outside the trapezoid when it no longer fits", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, funnelLayer());

    var nodes = valueNodes();
    expect(nodes[0].getAttribute("text-anchor")).toBe("middle");
    expect(nodes[0].getAttribute("fill-opacity")).toBe("1");
    expect(nodes[2].getAttribute("text-anchor")).toBe("start");
    expect(nodes[2].getAttribute("fill-opacity")).toBe("1");
  });

  test("showValues = FALSE suppresses the value labels", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, funnelLayer({ showValues: false }));

    var nodes = valueNodes();
    expect(nodes.length).toBe(3);
    nodes.forEach(function(node) {
      expect(node.textContent).toBe("");
      expect(node.getAttribute("fill-opacity")).toBe("0");
    });
  });

  // Geometry (jsdom 6.5px/char fallback): plot 320x220, fabGutter 36, so
  // fabLeft 284 and maxStageWidth 248. Stage A is 50 against a max of 100, so
  // topWidth 124 but bottomWidth 49.6 -- innerWidth 49.6 leaves 41.6 usable
  // against a 71.5px label, so the label has to go outside. outsideX is 228,
  // putting its right edge at 299.5: past fabLeft, still inside the plot.
  function fabFunnelLayer() {
    return {
      id: "funnel_1",
      label: "conversion",
      mapping: { stage: "stage", value: "value" },
      options: null,
      data: [
        { stage: "A", value: 50 },
        { stage: "B", value: 20 },
        { stage: "C", value: 100 }
      ]
    };
  }

  test("an outside value label that would slide under the button is suppressed", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, fabFunnelLayer());

    var first = valueNodes()[0];
    // The first stage is the only one whose label box can reach the band.
    expect(first.getAttribute("text-anchor")).toBe("start");
    expect(first.getAttribute("fill-opacity")).toBe("0");
  });

  test("the same label is kept when the button band is above the plot", function() {
    // Only margin.top moves, so the label's x geometry is identical -- the
    // horizontal test still says "does not fit before fabLeft". A blanket
    // horizontal cap would wrongly suppress this one too.
    var chart = makeFunnelChart();
    chart.margin = { top: 60, right: 20, bottom: 20, left: 20 };
    getRenderer("funnel").render(chart, fabFunnelLayer());

    var first = valueNodes()[0];
    expect(first.getAttribute("text-anchor")).toBe("start");
    expect(first.getAttribute("fill-opacity")).toBe("1");
  });

  function stagesLayer(values) {
    return {
      id: "funnel_1",
      label: "conversion",
      mapping: { stage: "stage", value: "value" },
      options: null,
      data: values.map(function(value, i) {
        return { stage: "S" + i, value: value };
      })
    };
  }

  function labelNodes() {
    return Array.from(document.querySelectorAll(".tag-funnel-funnel_1 .funnel-label"));
  }

  // Six stages over a 220px plot give a 30.67px band -- too short for two
  // lines, comfortably enough for one.
  test("a short stage band moves the value onto the name line instead of hiding it", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, stagesLayer([100, 70, 50, 35, 20, 10]));

    var values = valueNodes();
    var labels = labelNodes();
    expect(values.length).toBe(6);

    var last = values[5];
    expect(last.getAttribute("fill-opacity")).toBe("1");
    expect(last.getAttribute("text-anchor")).toBe("start");
    // One line: the value shares the stage name's baseline.
    expect(last.getAttribute("y")).toBe(labels[5].getAttribute("y"));
  });

  test("a stage band too short even for one line shows the name alone", function() {
    var chart = makeFunnelChart();
    var values = [];
    for (var i = 0; i < 13; i++) {
      values.push(100 - i * 5);
    }
    getRenderer("funnel").render(chart, stagesLayer(values));

    valueNodes().forEach(function(node) {
      expect(node.getAttribute("fill-opacity")).toBe("0");
    });
    labelNodes().forEach(function(node, i) {
      expect(node.textContent).toBe("S" + i);
    });
  });

  test("a tall stage band still uses the two-line placement", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, funnelLayer());

    var values = valueNodes();
    var labels = labelNodes();
    // Name lifted 9px above the band centre, value dropped 9px below it.
    expect(+values[0].getAttribute("y") - +labels[0].getAttribute("y")).toBe(18);
    expect(values[0].getAttribute("text-anchor")).toBe("middle");
    expect(values[0].getAttribute("fill-opacity")).toBe("1");
  });

  test("stage labels use an ink readable against their own fill", function() {
    var chart = makeFunnelChart();
    getRenderer("funnel").render(chart, funnelLayer());

    Array.from(document.querySelectorAll(".tag-funnel-funnel_1 .funnel-label")).forEach(function(node) {
      expect(["#000000", "#ffffff"]).toContain(node.getAttribute("fill"));
    });
  });
});

describe("Sankey value labels", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("node labels carry the node total", function() {
    var chart = makeSankeyChart();
    getRenderer("sankey").render(chart, sankeyLayer());

    var texts = Array.from(document.querySelectorAll("text.tag-sankey-label-chart-flow")).map(function(node) {
      return node.textContent;
    });
    expect(texts).toEqual(["A 2", "B 3", "C 3"]);
  });

  test("each link renders its flow magnitude", function() {
    var chart = makeSankeyChart();
    getRenderer("sankey").render(chart, sankeyLayer());

    var nodes = Array.from(document.querySelectorAll("text.tag-sankey-flow-chart-flow"));
    expect(nodes.length).toBe(2);
    expect(nodes.map(function(node) { return node.textContent; })).toEqual(["2", "3"]);
    nodes.forEach(function(node) {
      expect(node.getAttribute("fill-opacity")).toBe("1");
    });
  });

  test("showValues = FALSE leaves bare node names and no flow labels", function() {
    var chart = makeSankeyChart();
    getRenderer("sankey").render(chart, sankeyLayer({ showValues: false }));

    expect(Array.from(document.querySelectorAll("text.tag-sankey-label-chart-flow")).map(function(node) {
      return node.textContent;
    })).toEqual(["A", "B", "C"]);
    expect(document.querySelectorAll("text.tag-sankey-flow-chart-flow").length).toBe(0);
  });
});
