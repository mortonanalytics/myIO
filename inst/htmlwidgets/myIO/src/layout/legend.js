import { isMobile, responsiveValue } from "../utils/responsive.js";

export function syncLegend(chart, state) {
  if (chart.options.suppressLegend == true) {
    return;
  }

  if (!chart.legendArea) {
    return;
  }

  if (state.continuousLegend) {
    updateContinuousColorLegend(chart);
    return;
  }

  if (state.ordinalLegend) {
    updateOrdinalColorLegend(chart, chart.currentLayers[0]);
    return;
  }

  updateLegend(chart);
}

export function updateLegend(chart) {
  if (!chart.legendArea) {
    return;
  }

  var m = chart.margin;
  var activeLayers = chart.currentLayers || [];
  var legendLayers = [];

  if (activeLayers.length === 0) {
    d3.select(chart.element).select(".legend-box").remove();
    d3.select(chart.element).selectAll(".legendElements").remove();
    return;
  }

  d3.select(chart.element).select(".legend-box").remove();
  d3.select(chart.element).selectAll(".legendElements").remove();

  var svg = chart.legendArea;
  var grouped = new Map();
  chart.plotLayers.forEach(function(layer) {
    var key = layer._composite || layer.label;
    if (!grouped.has(key)) {
      grouped.set(key, { key: key, label: key, color: layer.color, type: layer.type, layerLabels: [] });
    }
    grouped.get(key).layerLabels.push(layer.label);
  });
  legendLayers = Array.from(grouped.values());
  var labelIndex = legendLayers.map(function(d) { return d.label; });
  var currentLayerIndex = activeLayers.map(function(d) { return d._composite || d.label; });
  var hiddenLayers = labelIndex.filter(function(d) { return currentLayerIndex.indexOf(d) < 0; });
  var itemWidth = responsiveValue(chart, 140, 125);
  var itemHeight = responsiveValue(chart, 25, 22);
  var n = isMobile(chart) ? Math.max(1, Math.floor(chart.totalWidth / itemWidth)) : 1;

  svg.append("rect")
    .attr("class", "legend-box")
    .attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")")
    .style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left))
    .style("fill", "white")
    .style("opacity", 0.75);

  legendLayers.forEach(function(layer, i) {
    var legendElement = svg.append("g")
      .attr("class", "legendElements")
      .selectAll(".legendElement")
      .data([layer.label])
      .enter()
      .append("g")
      .attr("class", "legendElement")
      .attr("transform", function() {
        return "translate(" + i % n * itemWidth + "," + Math.floor(i / n) * itemHeight + ")";
      })
      .attr("text-anchor", "start")
      .attr("font-size", responsiveValue(chart, 12, 10))
      .style("opacity", 1)
      .attr("tabindex", 0)
      .attr("role", "switch")
      .attr("aria-checked", currentLayerIndex.indexOf(layer.label) > -1 ? "true" : "false")
      .on("click", toggleLine)
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleLine.call(this, event);
        }
      })
      .on("mouseover", hoverLegend)
      .on("mouseout", resetLegendHover);

    if (layer.type === "point") {
      legendElement.append("circle")
        .attr("class", "legend-swatch")
        .attr("cx", 5)
        .attr("cy", 6)
        .attr("r", 5)
        .attr("fill", layer.color)
        .attr("stroke", layer.color);
    } else {
      legendElement.append("rect")
        .attr("class", "legend-swatch")
        .attr("x", 5)
        .attr("y", layer.type === "line" ? 5 : 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", layer.color)
        .attr("stroke", layer.color);
    }

    legendElement.append("text")
      .attr("class", "legend-label")
      .attr("x", 20)
      .attr("y", 10.5)
      .attr("dy", "0.35em")
      .text(function(d) { return d; });

    applyLegendState(legendElement, currentLayerIndex.indexOf(layer.label) > -1);
  });

  var filteredElements = hiddenLayers ? hiddenLayers : [];

  function toggleLine() {
    var selectedData = d3.select(this).data();
    var isVisible;

    if (!filteredElements.includes(selectedData[0])) {
      filteredElements.push(selectedData[0]);
      isVisible = false;
    } else {
      filteredElements = filteredElements.filter(function(d) {
        return d !== selectedData[0];
      });
      isVisible = true;
    }

    applyLegendState(d3.select(this), isVisible);

    var filteredLayers = chart.plotLayers.filter(function(d) {
      return filteredElements.indexOf(d._composite || d.label) === -1;
    });
    var removedLayers = chart.plotLayers.filter(function(d) {
      return filteredElements.indexOf(d.label) > -1;
    }).map(function(d) {
      return d.label;
    });

    chart.derived.currentLayers = filteredLayers;
    chart.syncLegacyAliases();
    chart.renderCurrentLayers();
  }

  function hoverLegend() {
    var isVisible = d3.select(this).attr("aria-checked") === "true";
    d3.select(this).style("opacity", isVisible ? 0.8 : 0.3);
  }

  function resetLegendHover() {
    var isVisible = d3.select(this).attr("aria-checked") === "true";
    d3.select(this).style("opacity", isVisible ? 1 : null);
  }

  function applyLegendState(selection, isVisible) {
    selection
      .attr("aria-checked", isVisible ? "true" : "false")
      .style("opacity", isVisible ? 1 : null);

    selection.select(".legend-swatch")
      .style("opacity", isVisible ? 1 : "var(--chart-legend-inactive-opacity)");

    selection.select("text")
      .style("text-decoration", isVisible ? "none" : "line-through");
  }
}

export function updateOrdinalColorLegend(chart, ly) {
  if (chart.runtime._suppressOrdinalLegendRebuild) {
    return;
  }

  if (!chart.legendArea) {
    return;
  }

  var m = chart.margin;

  d3.select(chart.element).select(".legend-box").remove();
  d3.select(chart.element).selectAll(".legendElements").remove();

  var svg = chart.legendArea;
  var itemWidth = responsiveValue(chart, 140, 125);
  var itemHeight = responsiveValue(chart, 25, 22);
  var n = isMobile(chart) ? Math.max(1, Math.floor(chart.totalWidth / itemWidth)) : 1;
  var colorKey = [];

  svg.append("rect")
    .attr("class", "legend-box")
    .attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")")
    .style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left))
    .style("fill", "white")
    .style("opacity", 0.75);

  if (ly.type === "treemap") {
    colorKey = ly.data.children.map(function(d) { return d.name; });
  } else if (ly.type === "donut") {
    colorKey = ly.data.map(function(d) { return d[ly.mapping.x_var]; });
  }

  if (!chart.runtime._hiddenOrdinalSegments) {
    chart.runtime._hiddenOrdinalSegments = [];
  }
  var hidden = chart.runtime._hiddenOrdinalSegments;

  colorKey.forEach(function(d, i) {
    var swatchColor = ly.type === "treemap" ? chart.colorDiscrete("treemap." + d) : chart.colorDiscrete(d);
    var isVisible = hidden.indexOf(d) === -1;
    var legendElement = svg.append("g")
      .attr("class", "legendElements")
      .selectAll(".legendElement")
      .data([d])
      .enter()
      .append("g")
      .attr("class", "legendElement")
      .attr("tabindex", 0)
      .attr("role", "switch")
      .attr("aria-checked", isVisible ? "true" : "false")
      .attr("transform", function() {
        return "translate(" + i % n * itemWidth + "," + Math.floor(i / n) * itemHeight + ")";
      })
      .attr("text-anchor", "start")
      .attr("font-size", responsiveValue(chart, 12, 10))
      .style("cursor", "pointer")
      .on("click", function() {
        var segment = d3.select(this).data()[0];
        var idx = hidden.indexOf(segment);
        if (idx === -1) {
          hidden.push(segment);
        } else {
          hidden.splice(idx, 1);
        }
        var nowVisible = hidden.indexOf(segment) === -1;
        d3.select(this).attr("aria-checked", nowVisible ? "true" : "false");
        applyLegendState(d3.select(this), nowVisible);

        chart.runtime._suppressOrdinalLegendRebuild = true;
        chart.routeLayers([ly]);
        chart.runtime._suppressOrdinalLegendRebuild = false;
      });

    legendElement.append("rect")
      .attr("class", "legend-swatch")
      .attr("x", 5)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", swatchColor)
      .attr("stroke", swatchColor);

    legendElement.append("text")
      .attr("x", 20)
      .attr("y", 10.5)
      .attr("dy", "0.35em")
      .text(d);

    applyLegendState(legendElement, isVisible);
  });

  function applyLegendState(selection, isVisible) {
    selection.select(".legend-swatch")
      .style("opacity", isVisible ? 1 : "var(--chart-legend-inactive-opacity)");
    selection.select("text")
      .style("text-decoration", isVisible ? "none" : null);
  }
}

export function updateContinuousColorLegend(chart) {
  if (!chart.legendArea) {
    return;
  }

  var m = chart.margin;

  d3.select(chart.element).select(".legend-box").remove();
  d3.select(chart.element).selectAll(".legendElements").remove();
  d3.select(chart.element).select("#linear-gradient").remove();

  var svg = chart.legendArea;
  var defs = chart.chart.select("defs");
  var colorContinuous = chart.colorContinuous;

  svg.append("rect")
    .attr("class", "legend-box")
    .attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")")
    .style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left))
    .style("fill", "white")
    .style("opacity", 0.75);

  if (!isMobile(chart)) {
    buildVerticalLegend();
  } else {
    buildHorizontalLegend();
  }

  function buildVerticalLegend() {
    const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");

    linearGradient.selectAll("stop")
      .data(colorContinuous.ticks().map(function(t, i, n) {
        return { offset: 100 * i / n.length + "%", color: colorContinuous(t) };
      }))
      .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });

    svg.append("g")
      .attr("class", "legendElements")
      .attr("transform", "translate(10, 15)")
      .append("rect")
      .attr("transform", "translate(0, 0)")
      .attr("width", 20)
      .attr("height", chart.height - m.top - 10)
      .style("fill", "url(#linear-gradient)");

    var legendScale = d3.scaleLinear()
      .range([chart.height - m.top - m.bottom, 0])
      .domain([colorContinuous.domain()[0], colorContinuous.domain()[1]]);

    svg.append("g")
      .attr("class", "legendElements legendAxis")
      .attr("transform", "translate(30, 15)")
      .call(d3.axisRight().scale(legendScale).ticks(5))
      .selectAll("text")
      .attr("class", "legend-label");

    svg.selectAll(".domain").attr("class", "legend-line");
  }

  function buildHorizontalLegend() {
    const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
      .data(colorContinuous.ticks().map(function(t, i, n) {
        return { offset: 100 * i / n.length + "%", color: colorContinuous(t) };
      }))
      .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });

    svg.append("g")
      .attr("class", "legendElements legendBox")
      .attr("transform", "translate(0, 20)")
      .append("rect")
      .attr("transform", "translate(10, 0)")
      .attr("width", chart.width - m.right - m.left)
      .attr("height", 20)
      .style("fill", "url(#linear-gradient)");

    var legendScale = d3.scaleLinear()
      .range([0, chart.width - m.right - m.left])
      .domain([colorContinuous.domain()[0], colorContinuous.domain()[1]]);

    svg.append("g")
      .attr("class", "legendElements legendAxis")
      .attr("transform", "translate(10, 40)")
      .call(d3.axisBottom().scale(legendScale).ticks(5))
      .selectAll("text")
      .attr("class", "legend-label");

    svg.selectAll(".domain").attr("class", "legend-line");
  }
}
