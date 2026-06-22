export class DataTableFallback {
  constructor(chart) {
    this.chart = chart;
    this.tableContainer = null;
    this.visible = false;
  }

  initialize() {
    this.tableContainer = d3.select(this.chart.dom.element)
      .append("div")
      .attr("class", "myIO-data-table myIO-sr-only")
      .attr("role", "region")
      .attr("aria-label", "Chart data table");
  }

  generate() {
    if (!this.tableContainer) {
      return;
    }

    this.tableContainer.selectAll("*").remove();

    var layers = this.chart.config.layers;
    var maxRows = 500;

    var fanGroups = new Map();
    var regularLayers = [];

    for (var groupIndex = 0; groupIndex < layers.length; groupIndex++) {
      var candidate = layers[groupIndex];
      if (candidate && candidate._composite === "fan") {
        var key = String(candidate.id || "").replace(/_sub_\d+$/, "") || candidate.label || "fan";
        if (!fanGroups.has(key)) {
          fanGroups.set(key, []);
        }
        fanGroups.get(key).push(candidate);
      } else {
        regularLayers.push(candidate);
      }
    }

    var self = this;
    fanGroups.forEach(function(groupLayers) {
      self.renderFanTable(groupLayers, maxRows);
    });

    for (var i = 0; i < regularLayers.length; i++) {
      var layer = regularLayers[i];
      var data = Array.isArray(layer.data) ? layer.data : [];
      var display = data.slice(0, maxRows);
      var columns = Object.values(layer.mapping || {}).filter(Boolean);

      var table = this.tableContainer.append("table")
        .attr("aria-label", "Data for " + (layer.label || layer.type));

      var thead = table.append("thead");
      var headerRow = thead.append("tr");
      for (var c = 0; c < columns.length; c++) {
        headerRow.append("th").attr("scope", "col").text(columns[c]);
      }

      var tbody = table.append("tbody");
      for (var r = 0; r < display.length; r++) {
        var row = tbody.append("tr");
        for (var c2 = 0; c2 < columns.length; c2++) {
          var value = display[r][columns[c2]];
          row.append("td").text(value != null ? String(value) : "");
        }
      }

      if (data.length > maxRows) {
        this.tableContainer.append("p")
          .text("Showing first " + maxRows + " of " + data.length + " rows");
      }
    }
  }

  renderFanTable(layers, maxRows) {
    if (!layers || layers.length === 0) {
      return;
    }
    var first = layers[0];
    var xField = first.mapping && first.mapping.x_var ? first.mapping.x_var : "x_var";
    var rowMap = new Map();
    var levels = [];

    layers.forEach(function(layer) {
      var pct = layer.options && layer.options.interval_pct;
      if (pct == null) {
        return;
      }
      var suffix = formatLevel(pct);
      levels.push(+pct);
      (Array.isArray(layer.data) ? layer.data : []).forEach(function(d) {
        var key = String(d[xField]);
        if (!rowMap.has(key)) {
          rowMap.set(key, { x_var: d[xField] });
        }
        var row = rowMap.get(key);
        row["low_" + suffix] = d[layer.mapping.low_y];
        row["high_" + suffix] = d[layer.mapping.high_y];
      });
    });

    levels = Array.from(new Set(levels)).sort(function(a, b) { return a - b; });
    var columns = ["x_var"];
    levels.forEach(function(level) {
      var suffix = formatLevel(level);
      columns.push("low_" + suffix);
      columns.push("high_" + suffix);
    });

    var rows = Array.from(rowMap.values());
    var display = rows.slice(0, maxRows);
    var table = this.tableContainer.append("table")
      .attr("aria-label", "Data for " + (first._composite || "fan"));
    var headerRow = table.append("thead").append("tr");
    columns.forEach(function(column) {
      headerRow.append("th").attr("scope", "col").text(column);
    });
    var tbody = table.append("tbody");
    display.forEach(function(d) {
      var row = tbody.append("tr");
      columns.forEach(function(column) {
        var value = d[column];
        row.append("td").text(value != null ? String(value) : "");
      });
    });
    if (rows.length > maxRows) {
      this.tableContainer.append("p")
        .text("Showing first " + maxRows + " of " + rows.length + " rows");
    }
  }

  toggle() {
    this.visible = !this.visible;

    if (this.visible) {
      this.generate();
      this.tableContainer.classed("myIO-sr-only", false);
      this.chart.dom.svg.attr("aria-hidden", "true");
    } else {
      this.tableContainer.classed("myIO-sr-only", true);
      this.chart.dom.svg.attr("aria-hidden", null);
    }
  }

  destroy() {
    if (this.tableContainer) {
      this.tableContainer.remove();
    }
  }
}

function formatLevel(level) {
  return String(level).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
