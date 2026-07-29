import { deriveChartRender, applyDerivedScales } from "../derive/chart-render.js";
import { validateLayers } from "../derive/validate.js";
import { FacetPanel } from "./facet-panel.js";

var FACET_PANEL_HEIGHT = 200;

export class FacetController {
  constructor(chart) {
    this.chart = chart;
    this.config = chart.config.facet || {};
    this.panels = new Map();
    this.container = null;
    this.resizeObserver = null;
    this.validatedLayers = [];
    this.globalScaleSnapshot = null;
  }

  initialize() {
    this.destroy();
    this.config = this.chart.config.facet || {};
    this.validatedLayers = this.getValidatedLayers();

    if (this.chart.dom && this.chart.dom.svg) {
      this.chart.dom.svg.style("display", "none");
    }

    d3.select(this.chart.dom.element)
      .selectAll(".myIO-fab, .myIO-panel, .myIO-sheet-backdrop")
      .remove();

    if (this.validatedLayers.length === 0) {
      this.createGrid([]);
      return;
    }

    var facetValues = this.groupData();
    this.globalScaleSnapshot = this.config.scales === "fixed"
      ? this.captureGlobalScaleSnapshot(this.validatedLayers)
      : null;

    this.createGrid(facetValues);

    for (var i = 0; i < facetValues.length; i += 1) {
      var value = facetValues[i];
      var panelDiv = this.container.append("div")
        .attr("class", "myIO-facet-panel")
        .attr("data-facet-value", value);

      var panel = new FacetPanel(this, value, panelDiv.node(), i, facetValues.length);
      panel.initialize(this.filterLayersForValue(value));
      this.panels.set(value, panel);
    }
  }

  getValidatedLayers() {
    var previousLayers = this.chart.derived.currentLayers;
    this.chart.derived.currentLayers = this.chart.config.layers || [];
    var layers = validateLayers(this.chart);
    this.chart.derived.currentLayers = previousLayers;
    return layers;
  }

  groupData() {
    var facetVar = this.config.var;
    var valueSet = {};

    for (var i = 0; i < this.validatedLayers.length; i += 1) {
      var data = this.validatedLayers[i].data || [];
      for (var j = 0; j < data.length; j += 1) {
        var val = String(data[j][facetVar]);
        valueSet[val] = true;
      }
    }

    return Object.keys(valueSet).sort();
  }

  filterLayersForValue(value) {
    var facetVar = this.config.var;
    return this.validatedLayers.map(function(layer) {
      return Object.assign({}, layer, {
        data: (layer.data || []).filter(function(d) {
          return String(d[facetVar]) === value;
        })
      });
    });
  }

  createGrid(facetValues) {
    var root = d3.select(this.chart.dom.element);
    root.select(".myIO-facet-title").remove();
    root.select(".myIO-facet-grid").remove();

    var title = this.chart.config.title;
    if (title) {
      root.append("div")
        .attr("class", "myIO-facet-title")
        .text(title);
    }

    this.container = root
      .append("div")
      .attr("class", "myIO-facet-grid")
      .attr("role", "group")
      .attr("aria-label", "Small multiples chart faceted by " + this.config.var);

    if (this.config.ncol) {
      this.container.style("grid-template-columns", "repeat(" + this.config.ncol + ", 1fr)");
    } else {
      this.container.style(
        "grid-template-columns",
        "repeat(auto-fill, minmax(" + (this.config.minWidth || 200) + "px, 1fr))"
      );
    }

    if (!facetValues.length) {
      this.container.append("div")
        .attr("class", "myIO-facet-panel myIO-facet-empty")
        .text("No data");
    }
  }

  captureGlobalScaleSnapshot(layers) {
    if (!layers || !layers.length) {
      return null;
    }

    var scaleChart = {
      config: this.chart.config,
      derived: { currentLayers: layers.slice() },
      margin: Object.assign({}, this.chart.config.layout.margin),
      width: Math.max((this.config.minWidth || 200), 1),
      height: FACET_PANEL_HEIGHT,
      runtime: {
        totalWidth: Math.max((this.config.minWidth || 200), 1)
      },
      syncLegacyAliases: function() {}
    };
    var renderState = deriveChartRender(scaleChart);

    if (!renderState.axesChart) {
      return {
        renderState: renderState
      };
    }

    applyDerivedScales(scaleChart, renderState);

    return {
      renderState: renderState,
      xDomain: scaleChart.derived.xScale ? scaleChart.derived.xScale.domain().slice() : null,
      yDomain: scaleChart.derived.yScale ? scaleChart.derived.yScale.domain().slice() : null,
      xBanded: scaleChart.derived.xBanded ? scaleChart.derived.xBanded.slice() : null,
      yBanded: scaleChart.derived.yBanded ? scaleChart.derived.yBanded.slice() : null,
      xCheck: scaleChart.derived.xCheck,
      colorDiscrete: scaleChart.derived.colorDiscrete || null,
      colorContinuous: scaleChart.derived.colorContinuous || null
    };
  }

  resize() {
    var width = this.chart.dom && this.chart.dom.element ? this.chart.dom.element.clientWidth : 0;
    if (this.chart.runtime) {
      this.chart.runtime.totalWidth = Math.max(width || this.chart.runtime.totalWidth || 0, 1);
      this.chart.runtime.width = this.chart.runtime.totalWidth;
    }

    if (this.config.scales === "fixed") {
      this.globalScaleSnapshot = this.captureGlobalScaleSnapshot(this.validatedLayers);
    }

    for (var panel of this.panels.values()) {
      panel.resize();
    }
  }

  destroy() {
    for (var panel of this.panels.values()) {
      panel.destroy();
    }

    this.panels.clear();
    d3.select(this.chart.dom.element).select(".myIO-facet-title").remove();
    d3.select(this.chart.dom.element).select(".myIO-facet-grid").remove();
    this.container = null;
    this.globalScaleSnapshot = null;

    if (this.chart.dom && this.chart.dom.svg) {
      this.chart.dom.svg.style("display", null);
    }
  }
}
