import { deriveChartRender, applyDerivedScales } from "../derive/chart-render.js";
import { getRendererForLayer } from "../registry.js";
import { syncAxes } from "./axes.js";
import { syncReferenceLines } from "./reference-lines.js";
import { initializeScaffold } from "./scaffold.js";

var FACET_PANEL_HEIGHT = 200;

export class FacetPanel {
  constructor(controller, facetValue, element, index, total) {
    this.controller = controller;
    this.facetValue = facetValue;
    this.element = element;
    this.index = index;
    this.total = total;
    this.layers = [];
    this.panelChart = null;

    if (!this.element.id) {
      this.element.id = controller.chart.dom.element.id + "-facet-panel-" + index;
    }
  }

  initialize(layers) {
    this.layers = layers || [];
    this.destroy();

    var labelPos = this.controller.config.labelPosition || "top";
    if (labelPos === "top") {
      this.addLabel();
    }

    if (this.hasPanelData()) {
      this.renderPanel();
    } else {
      this.renderEmptyPanel();
    }

    if (labelPos === "bottom") {
      this.addLabel();
    }
  }

  hasPanelData() {
    for (var i = 0; i < this.layers.length; i += 1) {
      if (this.layers[i].data && this.layers[i].data.length > 0) {
        return true;
      }
    }
    return false;
  }

  addLabel() {
    d3.select(this.element)
      .append("div")
      .attr("class", "myIO-facet-label")
      .text(this.facetValue);
  }

  renderPanel() {
    var panelChart = this.buildPanelChart();
    var renderState = deriveChartRender(panelChart);

    if (renderState.axesChart) {
      applyDerivedScales(panelChart, renderState);
      this.applySharedDomains(panelChart);
    }

    initializeScaffold(panelChart);
    panelChart.dom.svg = panelChart.svg;
    panelChart.dom.plot = panelChart.plot;
    panelChart.dom.chartArea = panelChart.chart;

    if (renderState.axesChart && this.requiresClipPath(renderState.type)) {
      this.setClipPath(panelChart);
      syncAxes(panelChart, renderState, { isInitialRender: true });
      syncReferenceLines(panelChart, renderState, { isInitialRender: true });
    }

    this.renderLayers(panelChart, this.layers);
    this.panelChart = panelChart;
  }

  buildPanelChart() {
    var parentChart = this.controller.chart;
    var width = Math.max(this.element.clientWidth || this.controller.config.minWidth || 200, 1);
    var margin = this.buildMargin();
    var panelConfig = Object.assign({}, parentChart.config, {
      layers: this.layers,
      title: null
    });
    var options = {
      margin: margin,
      suppressLegend: true,
      suppressAxis: parentChart.config.layout.suppressAxis || { xAxis: false, yAxis: false },
      xlim: panelConfig.scales.xlim,
      ylim: panelConfig.scales.ylim,
      categoricalScale: panelConfig.scales.categoricalScale,
      flipAxis: panelConfig.scales.flipAxis,
      colorScheme: panelConfig.scales.colorScheme
        ? (panelConfig.scales.colorScheme.enabled
            ? [panelConfig.scales.colorScheme.colors, panelConfig.scales.colorScheme.domain, "on"]
            : [panelConfig.scales.colorScheme.colors, panelConfig.scales.colorScheme.domain, "off"])
        : null,
      xAxisFormat: panelConfig.axes.xAxisFormat,
      yAxisFormat: panelConfig.axes.yAxisFormat,
      toolTipFormat: panelConfig.axes.toolTipFormat,
      xTickLabels: panelConfig.axes.xTickLabels,
      xAxisLabel: panelConfig.axes.xAxisLabel,
      yAxisLabel: panelConfig.axes.yAxisLabel,
      dragPoints: false,
      toggleY: null,
      toolTipOptions: panelConfig.interactions.toolTipOptions,
      transition: { speed: 0 },
      referenceLine: panelConfig.referenceLines
    };

    return {
      element: this.element,
      dom: { element: this.element },
      config: panelConfig,
      derived: { currentLayers: this.layers.slice() },
      runtime: {
        totalWidth: width,
        width: width,
        height: FACET_PANEL_HEIGHT,
        layout: parentChart.runtime.layout,
        activeY: parentChart.runtime.activeY,
        activeYFormat: parentChart.runtime.activeYFormat
      },
      options: options,
      margin: margin,
      width: width,
      height: FACET_PANEL_HEIGHT,
      totalWidth: width,
      layout: parentChart.runtime.layout,
      newY: parentChart.runtime.activeY,
      newScaleY: parentChart.runtime.activeYFormat,
      plotLayers: this.layers,
      emit: function() {},
      dragPoints: function() {},
      updateRegression: function() {},
      syncLegacyAliases: function() {
        this.xScale = this.derived ? this.derived.xScale : null;
        this.yScale = this.derived ? this.derived.yScale : null;
        this.colorDiscrete = this.derived ? this.derived.colorDiscrete : null;
        this.colorContinuous = this.derived ? this.derived.colorContinuous : null;
        this.x_banded = this.derived ? this.derived.xBanded : null;
        this.y_banded = this.derived ? this.derived.yBanded : null;
        this.x_check = this.derived ? this.derived.xCheck : null;
        this.currentLayers = this.derived ? this.derived.currentLayers : null;
      },
      captureLegacyAliases: function() {}
    };
  }

  buildMargin() {
    var baseMargin = this.controller.chart.config.layout.margin || {};
    var margin = {
      top: baseMargin.top != null ? baseMargin.top : 30,
      right: baseMargin.right != null ? baseMargin.right : 5,
      bottom: baseMargin.bottom != null ? baseMargin.bottom : 60,
      left: baseMargin.left != null ? baseMargin.left : 50
    };

    return margin;
  }

  applySharedDomains(panelChart) {
    var snapshot = this.controller.globalScaleSnapshot;
    if (!snapshot || !panelChart.derived || !panelChart.derived.xScale || !panelChart.derived.yScale) {
      return;
    }

    if (snapshot.xDomain) {
      panelChart.derived.xScale.domain(snapshot.xDomain.slice());
    }
    if (snapshot.yDomain) {
      panelChart.derived.yScale.domain(snapshot.yDomain.slice());
    }
    if (snapshot.xBanded) {
      panelChart.derived.xBanded = snapshot.xBanded.slice();
    }
    if (snapshot.yBanded) {
      panelChart.derived.yBanded = snapshot.yBanded.slice();
    }
    if (typeof snapshot.xCheck !== "undefined") {
      panelChart.derived.xCheck = snapshot.xCheck;
    }
    if (snapshot.colorDiscrete) {
      panelChart.derived.colorDiscrete = snapshot.colorDiscrete;
    }
    if (snapshot.colorContinuous) {
      panelChart.derived.colorContinuous = snapshot.colorContinuous;
    }

    panelChart.syncLegacyAliases();
  }

  requiresClipPath(type) {
    return type !== "donut" && type !== "gauge";
  }

  setClipPath(panelChart) {
    var chartHeight = panelChart.height - (panelChart.margin.top + panelChart.margin.bottom);
    panelChart.dom.clipPath = panelChart.dom.chartArea.append("defs").append("svg:clipPath")
      .attr("id", panelChart.dom.element.id + "clip")
      .append("svg:rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", panelChart.width - (panelChart.margin.left + panelChart.margin.right))
      .attr("height", chartHeight);
    panelChart.dom.chartArea.attr("clip-path", "url(#" + panelChart.dom.element.id + "clip)");
    panelChart.clipPath = panelChart.dom.clipPath;
  }

  renderLayers(panelChart, layers) {
    for (var i = 0; i < layers.length; i += 1) {
      var renderer = getRendererForLayer(layers[i]);
      if (renderer && typeof renderer.render === "function") {
        renderer.render(panelChart, layers[i], layers);
      }
    }
  }

  renderEmptyPanel() {
    d3.select(this.element).classed("myIO-facet-empty", true);
    var width = Math.max(this.element.clientWidth || this.controller.config.minWidth || 200, 1);

    this.panelChart = {
      svg: d3.select(this.element)
        .append("svg")
        .attr("class", "myIO-svg")
        .attr("width", "100%")
        .attr("height", FACET_PANEL_HEIGHT)
        .attr("viewBox", "0 0 " + width + " " + FACET_PANEL_HEIGHT)
    };

    this.panelChart.svg.append("text")
      .attr("x", width / 2)
      .attr("y", FACET_PANEL_HEIGHT / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--chart-grid-color)")
      .style("font-size", "11px")
      .style("font-style", "italic")
      .text("No data");
  }

  resize() {
    if (!this.element || !this.element.isConnected) {
      return;
    }

    this.initialize(this.layers);
  }

  destroy() {
    d3.select(this.element).classed("myIO-facet-empty", false);
    d3.select(this.element).selectAll("*").remove();
    this.panelChart = null;
  }
}
