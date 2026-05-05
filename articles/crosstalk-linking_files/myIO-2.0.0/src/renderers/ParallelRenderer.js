export class ParallelRenderer {
  static type = "parallel";
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
    dimensions: { required: true }
  };

  render(chart, layer) {
    var margin = chart.margin || (chart.config && chart.config.layout ? chart.config.layout.margin : { top: 0, right: 0, bottom: 0, left: 0 });
    var width = ((chart.width || (chart.runtime && chart.runtime.width) || 0) - margin.left - margin.right);
    var height = ((chart.height || (chart.runtime && chart.runtime.height) || 0) - margin.top - margin.bottom);
    var rawDimensions = layer.mapping.dimensions;
    var dimensions = Array.isArray(rawDimensions) ? rawDimensions.slice() : [rawDimensions];
    var groupVar = layer.mapping.group;
    var xScale = d3.scalePoint()
      .domain(dimensions)
      .range([0, width])
      .padding(0.5);
    var yScales = {};
    var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);
    var root;
    var axisGroups;
    var lineGenerator;

    dimensions.forEach(function(dimension) {
      var extent = d3.extent(layer.data, function(row) {
        var value = +row[dimension];
        return Number.isFinite(value) ? value : null;
      });
      if (!extent || extent[0] === undefined || extent[1] === undefined) {
        extent = [0, 1];
      }
      if (extent[0] === extent[1]) {
        extent = [extent[0] - 1, extent[1] + 1];
      }
      yScales[dimension] = d3.scaleLinear()
        .domain(extent)
        .range([height, 0]);
    });

    chart.derived.colorDiscrete = colorScale.domain(Array.from(new Set(layer.data.map(function(row) {
      return groupVar ? row[groupVar] : layer.label;
    }))));
    chart.colorDiscrete = chart.derived.colorDiscrete;

    root = chart.dom.chartArea.selectAll(".tag-parallel-" + layer.id)
      .data([null])
      .join("g")
      .attr("class", "tag-parallel-" + layer.id);

    axisGroups = root.selectAll(".parallel-axis")
      .data(dimensions)
      .join(function(enter) {
        var group = enter.append("g").attr("class", "parallel-axis");
        group.append("text").attr("class", "parallel-axis-label");
        return group;
      })
      .attr("transform", function(dimension) {
        return "translate(" + xScale(dimension) + ",0)";
      })
      .each(function(dimension) {
        d3.select(this).call(d3.axisLeft(yScales[dimension]).ticks(5));
      });

    axisGroups.select(".parallel-axis-label")
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .text(function(dimension) { return dimension; });

    lineGenerator = d3.line()
      .defined(function(point) {
        return point && point[1] !== null;
      })
      .x(function(point) { return point[0]; })
      .y(function(point) { return point[1]; });

    root.selectAll(".parallel-line")
      .data(layer.data)
      .join("path")
      .attr("class", "parallel-line")
      .attr("d", function(row) {
        var points = dimensions.map(function(dimension) {
          var value = +row[dimension];
          if (!Number.isFinite(value)) {
            return [xScale(dimension), null];
          }
          return [xScale(dimension), yScales[dimension](value)];
        });
        return lineGenerator(points);
      })
      .attr("stroke", function(row) {
        var colorKey = groupVar ? row[groupVar] : layer.label;
        return colorScale(colorKey);
      });
  }

  getHoverSelector(chart, layer) {
    return ".tag-parallel-" + layer.id + " .parallel-line";
  }

  formatTooltip(chart, d, layer) {
    var dimensions = Array.isArray(layer.mapping.dimensions) ? layer.mapping.dimensions : [layer.mapping.dimensions];
    var title = layer.mapping.group ? String(d[layer.mapping.group]) : String(layer.label || "Series");
    return {
      title: { text: title },
      items: dimensions.map(function(dimension) {
        return {
          color: chart.colorDiscrete
            ? chart.colorDiscrete(layer.mapping.group ? d[layer.mapping.group] : layer.label)
            : layer.color,
          label: dimension,
          value: String(d[dimension])
        };
      })
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-parallel-" + layer.id).remove();
  }
}
