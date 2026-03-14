import { getRenderer, getRendererForLayer, listRenderers } from "./registry.js";
import { addButtons as addInteractionButtons } from "./interactions/buttons.js";
import { bindPointDrag } from "./interactions/drag.js";
import { bindRollover } from "./interactions/rollover.js";
import { deriveChartRender, applyDerivedScales } from "./derive/chart-render.js";
import { validateLayers } from "./derive/validate.js";
import { transitionGrouped, transitionStacked, getGroupedDataObject } from "./renderers/groupedBarHelpers.js";
import { syncAxes } from "./layout/axes.js";
import { syncLegend } from "./layout/legend.js";
import { syncReferenceLines } from "./layout/reference-lines.js";
import { getChartHeight, initializeScaffold, updateScaffoldLayout } from "./layout/scaffold.js";
import { initializeTooltip, removeHoverOverlay } from "./tooltip.js";
import { isMobile, tagName } from "./utils/responsive.js";

const MIN_CHART_WIDTH = 280;
const PLOT_WIDTH_RATIO = 0.8;
const RESIZE_DEBOUNCE_MS = 100;

const EventEmitter = {
  on(event, handler) {
    this._listeners = this._listeners || {};
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(handler);
    return this;
  },
  off(event, handler) {
    if (!this._listeners || !this._listeners[event]) {
      return this;
    }
    this._listeners[event] = handler
      ? this._listeners[event].filter(function(candidate) { return candidate !== handler; })
      : [];
    return this;
  },
  emit(event, payload) {
    if (!this._listeners || !this._listeners[event]) {
      return this;
    }
    this._listeners[event].forEach(function(handler) {
      handler(payload);
    });
    return this;
  }
};

export class myIOchart {
  constructor(opts) {
    Object.assign(this, EventEmitter);
    this._listeners = {};
    this.config = opts.config;
    this.dom = { element: opts.element };
    this.derived = {};
    this.runtime = {
      renderGen: 0,
      resizeTimer: null,
      width: Math.max(opts.width, MIN_CHART_WIDTH),
      height: opts.height,
      totalWidth: Math.max(opts.width, MIN_CHART_WIDTH),
      layout: "grouped",
      activeY: null,
      activeYFormat: null
    };
    this.runtime.width = !isMobile(this) && !this.config.layout.suppressLegend
      ? this.runtime.totalWidth * PLOT_WIDTH_RATIO
      : this.runtime.totalWidth;
    this.syncLegacyAliases();
    this.draw();
  }

  syncLegacyAliases() {
    this.element = this.dom ? this.dom.element : null;
    this.svg = this.dom ? this.dom.svg : null;
    this.plot = this.dom ? this.dom.plot : null;
    this.chart = this.dom ? this.dom.chartArea : null;
    this.legendArea = this.dom ? this.dom.legendArea : null;
    this.clipPath = this.dom ? this.dom.clipPath : null;
    this.tooltip = this.dom ? this.dom.tooltip : null;
    this.toolTipTitle = this.dom ? this.dom.tooltipTitle : null;
    this.toolTipBody = this.dom ? this.dom.tooltipBody : null;
    this.plotLayers = this.config ? this.config.layers : null;
    this.options = this.config ? this.config : null;
    this.margin = this.config ? this.config.layout.margin : null;
    this.width = this.runtime ? this.runtime.width : null;
    this.height = this.runtime ? this.runtime.height : null;
    this.totalWidth = this.runtime ? this.runtime.totalWidth : null;
    this.layout = this.runtime ? this.runtime.layout : null;
    this.newY = this.runtime ? this.runtime.activeY : null;
    this.newScaleY = this.runtime ? this.runtime.activeYFormat : null;
    this.toolLine = this.runtime ? this.runtime.toolLine : null;
    this.toolTipBox = this.runtime ? this.runtime.toolTipBox : null;
    this.xScale = this.derived ? this.derived.xScale : null;
    this.yScale = this.derived ? this.derived.yScale : null;
    this.colorDiscrete = this.derived ? this.derived.colorDiscrete : null;
    this.colorContinuous = this.derived ? this.derived.colorContinuous : null;
    this.x_banded = this.derived ? this.derived.xBanded : null;
    this.y_banded = this.derived ? this.derived.yBanded : null;
    this.x_check = this.derived ? this.derived.xCheck : null;
    this.currentLayers = this.derived ? this.derived.currentLayers : null;
    this.layerIndex = this.derived ? this.derived.layerIndex : null;
  }

  captureLegacyAliases() {
    if (!this.dom || !this.runtime || !this.derived) {
      return;
    }
    this.dom.svg = this.svg || this.dom.svg;
    this.dom.plot = this.plot || this.dom.plot;
    this.dom.chartArea = this.chart || this.dom.chartArea;
    this.dom.legendArea = this.legendArea || this.dom.legendArea;
    this.dom.clipPath = this.clipPath || this.dom.clipPath;
    this.dom.tooltip = this.tooltip || this.dom.tooltip;
    this.dom.tooltipTitle = this.toolTipTitle || this.dom.tooltipTitle;
    this.dom.tooltipBody = this.toolTipBody || this.dom.tooltipBody;
    this.runtime.layout = this.layout || this.runtime.layout;
    this.runtime.activeY = this.newY || this.runtime.activeY;
    this.runtime.activeYFormat = this.newScaleY || this.runtime.activeYFormat;
    this.runtime.toolLine = this.toolLine || this.runtime.toolLine;
    this.runtime.toolTipBox = this.toolTipBox || this.runtime.toolTipBox;
    this.derived.xScale = this.xScale || this.derived.xScale;
    this.derived.yScale = this.yScale || this.derived.yScale;
    this.derived.colorDiscrete = this.colorDiscrete || this.derived.colorDiscrete;
    this.derived.colorContinuous = this.colorContinuous || this.derived.colorContinuous;
    this.derived.xBanded = this.x_banded || this.derived.xBanded;
    this.derived.yBanded = this.y_banded || this.derived.yBanded;
    this.derived.xCheck = this.x_check || this.derived.xCheck;
    this.derived.currentLayers = this.currentLayers || this.derived.currentLayers;
    this.derived.layerIndex = this.layerIndex || this.derived.layerIndex;
    this.syncLegacyAliases();
  }

  draw() {
    initializeScaffold(this);
    this.captureLegacyAliases();
    this.initialize();
  }

  initialize() {
    this.derived.currentLayers = this.config.layers;
    this.syncLegacyAliases();
    this.addButtons(this.derived.currentLayers);
    initializeTooltip(this);
    this.captureLegacyAliases();
    if (this.derived.currentLayers.length > 0) {
      this.setClipPath(this.derived.currentLayers[0].type);
    }
    this.renderCurrentLayers({ isInitialRender: true });
  }

  renderCurrentLayers(opts) {
    const options = opts || {};
    const generation = ++this.runtime.renderGen;
    const isCurrent = () => this.runtime && this.runtime.renderGen === generation;
    try {
      if (this.dom.chartArea) {
        this.dom.chartArea.selectAll("*").interrupt();
      }
      this.emit("beforeRender", { options });
      this.derived.currentLayers = validateLayers(this);
      this.syncLegacyAliases();
      if (!isCurrent()) {
        return;
      }
      const state = deriveChartRender(this);
      applyDerivedScales(this, state);
      this.captureLegacyAliases();
      if (!isCurrent()) {
        return;
      }
      this.emit("afterScales", { state });
      syncAxes(this, state, options);
      this.routeLayers(this.derived.currentLayers);
      syncReferenceLines(this, state, options);
      syncLegend(this, state);
      bindRollover(this);
      this.emit("afterRender", { state });
    } catch (error) {
      this.emit("error", { message: error.message, error });
      throw error;
    }
  }

  addButtons(layers) {
    addInteractionButtons(this, layers);
  }

  toggleVarY(newY) {
    this.runtime.activeY = newY[0];
    this.runtime.activeYFormat = newY[1];
    this.syncLegacyAliases();
    this.renderCurrentLayers();
  }

  toggleGroupedLayout(layers) {
    var data = getGroupedDataObject(layers, this);
    var colors = layers.map(function(layer) {
      return layer.color;
    });
    var bandwidth = ((this.runtime.width - (this.config.layout.margin.right + this.config.layout.margin.left)) / (data[0].length + 1)) / colors.length;

    if (this.runtime.layout === "stacked") {
      transitionGrouped(this, data, colors, bandwidth);
      this.runtime.layout = "grouped";
    } else {
      transitionStacked(this, data, colors, bandwidth);
      this.runtime.layout = "stacked";
    }
    this.syncLegacyAliases();
  }

  setClipPath(type) {
    switch (type) {
      case "donut":
      case "gauge":
        break;
      default:
        var chartHeight = getChartHeight(this);
        this.dom.clipPath = this.dom.chartArea.append("defs").append("svg:clipPath")
          .attr("id", this.dom.element.id + "clip")
          .append("svg:rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", this.runtime.width - (this.config.layout.margin.left + this.config.layout.margin.right))
          .attr("height", chartHeight - (this.config.layout.margin.top + this.config.layout.margin.bottom));
        this.dom.chartArea.attr("clip-path", "url(#" + this.dom.element.id + "clip)");
        this.syncLegacyAliases();
    }
  }

  routeLayers(layers) {
    var that = this;
    this.derived.layerIndex = this.config.layers.map(function(d) { return d.label; });
    this.syncLegacyAliases();
    layers.forEach(function(layer) {
      var renderer = getRendererForLayer(layer);
      if (renderer && typeof renderer.render === "function") {
        renderer.render(that, layer, layers);
        that.captureLegacyAliases();
      }
    });
  }

  removeLayers(labels) {
    labels.forEach((label) => {
      listRenderers().forEach(function(renderer) {
        if (typeof renderer.remove === "function") {
          renderer.remove(this, { label });
        } else {
          ["line", "bar", "point", "regression-line", "hexbin", "area", "crosshairY", "crosshairX"].forEach(function(prefix) {
            d3.selectAll("." + tagName(prefix, this.dom.element.id, label)).transition().duration(500).style("opacity", 0).remove();
          }, this);
        }
      }, this);
    });
  }

  dragPoints(layer) {
    bindPointDrag(this, layer);
  }

  updateRegression(color, label) {
    getRenderer("regression").renderFromPoints(this, color, label);
  }

  updateChart(newConfig) {
    this.config = newConfig;
    const newLabels = this.config.layers.map(function(layer) { return layer.label; });
    const oldLabels = this.derived.layerIndex || [];
    const removed = oldLabels.filter(function(label) { return !newLabels.includes(label); });
    this.syncLegacyAliases();
    this.renderCurrentLayers();
    this.removeLayers(removed);
  }

  resize(width, height) {
    this.runtime.totalWidth = Math.max(width, MIN_CHART_WIDTH);
    this.runtime.width = !isMobile(this) && !this.config.layout.suppressLegend
      ? this.runtime.totalWidth * PLOT_WIDTH_RATIO
      : this.runtime.totalWidth;
    this.runtime.height = height;
    this.syncLegacyAliases();
    clearTimeout(this.runtime.resizeTimer);
    this.runtime.resizeTimer = setTimeout(() => {
      updateScaffoldLayout(this);
      this.captureLegacyAliases();
      this.renderCurrentLayers();
      this.emit("resize", { width: this.runtime.width, height: this.runtime.height });
    }, RESIZE_DEBOUNCE_MS);
  }

  destroy() {
    this.emit("destroy", {});
    clearTimeout(this.runtime && this.runtime.resizeTimer);
    if (this.dom && this.dom.chartArea) {
      this.dom.chartArea.selectAll("*").interrupt();
    }
    if (this.dom && this.dom.svg) {
      this.dom.svg.remove();
    }
    if (this.dom && this.dom.tooltip) {
      this.dom.tooltip.remove();
    }
    if (this.dom && this.dom.element) {
      d3.select(this.dom.element).select(".buttonDiv").remove();
    }
    removeHoverOverlay(this);
    this._listeners = {};
    this.config = null;
    this.derived = null;
    this.dom = null;
    this.runtime = null;
  }
}
