function sanitizeLabel(label) {
  return String(label).replace(/[^a-zA-Z0-9_-]/g, "");
}

function getLayerSymbols(chart, layer) {
  if (!chart || !chart.dom || !chart.dom.chartArea || !layer) {
    return d3.select(null);
  }

  var chartArea = chart.dom.chartArea;
  var label = sanitizeLabel(layer.label);
  var elementId = chart.dom.element.id;
  var selectors = [
    ".tag-" + layer.type + "-" + layer.id + ' [role="graphics-symbol"]'
  ];

  if (layer.type === "line") {
    selectors.push('.tag-point-' + elementId + "-" + label + '[role="graphics-symbol"]');
  }

  if (layer.type === "groupedBar") {
    selectors.push('.tag-grouped-bar-g rect[role="graphics-symbol"]');
  }

  selectors.push('.tag-' + layer.type + "-" + elementId + "-" + label + '[role="graphics-symbol"]');
  selectors.push('.tag-' + layer.type + "-" + layer.id + ' circle[role="graphics-symbol"]');
  selectors.push('.tag-' + layer.type + "-" + layer.id + ' rect[role="graphics-symbol"]');
  selectors.push('.tag-' + layer.type + "-" + layer.id + ' path[role="graphics-symbol"]');
  selectors.push('.tag-' + layer.type + "-" + layer.id + ' line[role="graphics-symbol"]');

  for (var i = 0; i < selectors.length; i++) {
    var selection = chartArea.selectAll(selectors[i]);
    if (!selection.empty()) {
      return selection;
    }
  }

  return d3.select(null);
}

export class KeyboardNavigator {
  constructor(chart) {
    this.chart = chart;
    this.state = "IDLE";
    this.layerIndex = 0;
    this.pointIndex = 0;
    this.debounceTimer = null;
    this.liveRegion = null;
    this._keyHandler = null;
  }

  initialize() {
    var self = this;

    this.liveRegion = d3.select(this.chart.dom.element)
      .append("div")
      .attr("role", "status")
      .attr("aria-live", "polite")
      .attr("aria-atomic", "true")
      .attr("class", "myIO-sr-only");

    this._keyHandler = function(event) { self.handleKey(event); };
    this.chart.dom.svg.on("keydown.a11y", this._keyHandler);
  }

  handleKey(event) {
    var key = event.key;

    switch (key) {
      case "ArrowRight":
        event.preventDefault();
        this.movePoint(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.movePoint(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        this.moveLayer(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.moveLayer(-1);
        break;
      case "Escape":
        event.preventDefault();
        this.reset();
        break;
    }
  }

  movePoint(delta) {
    var layers = this.getNavigableLayers();
    if (!layers.length) {
      return;
    }

    if (this.state === "IDLE") {
      this.state = "POINT";
      this.layerIndex = 0;
      this.pointIndex = 0;
    } else {
      var maxIndex = layers[this.layerIndex].data.length - 1;
      this.pointIndex = Math.max(0, Math.min(maxIndex, this.pointIndex + delta));
    }

    this.focusCurrent();
  }

  moveLayer(delta) {
    var layers = this.getNavigableLayers();
    if (!layers.length) {
      return;
    }

    var maxIndex = layers.length - 1;
    this.layerIndex = Math.max(0, Math.min(maxIndex, this.layerIndex + delta));
    this.pointIndex = 0;
    this.state = "POINT";
    this.focusCurrent();
  }

  focusCurrent() {
    var layers = this.getNavigableLayers();
    var layer = layers[this.layerIndex];

    if (!layer || !layer.data || !layer.data.length) {
      return;
    }

    var d = layer.data[this.pointIndex];
    if (!d) {
      return;
    }

    this.chart.dom.chartArea.selectAll(".myIO-kb-focus")
      .classed("myIO-kb-focus", false);

    var elements = getLayerSymbols(this.chart, layer);
    var pointIndex = this.pointIndex;
    var target = elements.filter(function(dd, i) {
      if (dd && d && dd._source_key != null && d._source_key != null) {
        return dd._source_key === d._source_key;
      }
      return dd === d || i === pointIndex;
    });

    if (!target.empty()) {
      target.classed("myIO-kb-focus", true);
    }

    var mapping = layer.mapping || {};
    var text = "";

    if (mapping.x_var && mapping.y_var && d) {
      text = String(d[mapping.x_var]) + ": " + String(d[mapping.y_var]);
    } else {
      text = "Point " + (this.pointIndex + 1) + " of " + layer.data.length;
    }

    this.announce(text);
  }

  announce(text) {
    var self = this;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(function() {
      if (self.liveRegion) {
        self.liveRegion.text(text);
      }
    }, 150);
  }

  reset() {
    this.state = "IDLE";
    this.chart.dom.chartArea.selectAll(".myIO-kb-focus")
      .classed("myIO-kb-focus", false);

    if (this.liveRegion) {
      this.liveRegion.text("");
    }
  }

  getNavigableLayers() {
    return this.chart.config.layers.filter(function(layer) {
      return layer.data && layer.data.length > 0 && layer.visibility !== false;
    });
  }

  destroy() {
    this.chart.dom.svg.on("keydown.a11y", null);

    if (this.liveRegion) {
      this.liveRegion.remove();
    }

    clearTimeout(this.debounceTimer);
  }
}
