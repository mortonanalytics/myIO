export class WaffleRenderer {
  static type = "waffle";
  static traits = {
    hasAxes: false,
    referenceLines: false,
    legendType: "ordinal",
    binning: false,
    rolloverStyle: "element",
    scaleCapabilities: {}
  };
  static scaleHints = null;
  static dataContract = {
    category: { required: true },
    value: { required: true, numeric: true }
  };

  render(chart, layer) {
    var rows = (layer.options && layer.options.rows) || 10;
    var cols = (layer.options && layer.options.cols) || 10;
    var totalCells = rows * cols;
    var cellGap = (layer.options && layer.options.cellGap) || 2;
    var cellRadius = (layer.options && layer.options.cellRadius) || 2;

    var m = chart.config.layout.margin;
    var chartWidth = chart.runtime.width - m.left - m.right;
    var chartHeight = chart.runtime.height - m.top - m.bottom;
    var cellSize = Math.min(
      (chartWidth - (cols - 1) * cellGap) / cols,
      (chartHeight - (rows - 1) * cellGap) / rows
    );

    var total = 0;
    for (var i = 0; i < layer.data.length; i++) {
      total += layer.data[i][layer.mapping.value];
    }

    var cells = [];
    var cellIndex = 0;
    var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);
    colorScale.domain(Array.from(new Set(layer.data.map(function(d) { return d[layer.mapping.category]; }))));
    chart.derived.colorDiscrete = colorScale;
    chart.colorDiscrete = colorScale;

    for (var i = 0; i < layer.data.length; i++) {
      var d = layer.data[i];
      var count = Math.round((d[layer.mapping.value] / total) * totalCells);
      for (var j = 0; j < count && cellIndex < totalCells; j++) {
        cells.push({
          category: d[layer.mapping.category],
          row: Math.floor(cellIndex / cols),
          col: cellIndex % cols,
          color: colorScale(d[layer.mapping.category]),
          datum: d,
          _source_key: d._source_key
        });
        cellIndex++;
      }
    }

    var gridWidth = cols * cellSize + (cols - 1) * cellGap;
    var gridHeight = rows * cellSize + (rows - 1) * cellGap;
    var offsetX = (chartWidth - gridWidth) / 2;
    var offsetY = (chartHeight - gridHeight) / 2;

    var group = chart.dom.chartArea.selectAll(".tag-waffle-" + layer.id)
      .data([null]).join("g")
      .attr("class", "tag-waffle-" + layer.id)
      .attr("transform", "translate(" + offsetX + "," + offsetY + ")");

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;

    var cellSelection = group.selectAll(".waffle-cell")
      .data(cells, function(d) { return d.row + "_" + d.col; });

    cellSelection.exit()
      .transition().duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var cellEnter = cellSelection.enter().append("rect")
      .attr("class", "waffle-cell")
      .attr("x", function(d) { return d.col * (cellSize + cellGap); })
      .attr("y", function(d) { return d.row * (cellSize + cellGap); })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("rx", cellRadius)
      .attr("fill", function(d) { return d.color; })
      .style("opacity", 0);

    cellEnter.merge(cellSelection)
      .transition().duration(transitionSpeed)
      .attr("x", function(d) { return d.col * (cellSize + cellGap); })
      .attr("y", function(d) { return d.row * (cellSize + cellGap); })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", function(d) { return d.color; })
      .style("opacity", 1);
  }

  getHoverSelector(chart, layer) {
    return ".tag-waffle-" + layer.id + " .waffle-cell";
  }

  formatTooltip(chart, d, layer) {
    return {
      title: { text: d.category },
      items: [{ color: d.color, label: d.category, value: String(d.datum[layer.mapping.value]) }]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-waffle-" + layer.id).remove();
  }
}
