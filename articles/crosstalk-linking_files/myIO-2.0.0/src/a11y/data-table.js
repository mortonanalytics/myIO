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

    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
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
