(() => {
  // inst/htmlwidgets/myIO/src/utils/responsive.js
  var MOBILE_BREAKPOINT = 600;
  function isMobile(chart) {
    return chart.runtime.totalWidth <= MOBILE_BREAKPOINT;
  }
  function responsiveValue(chart, desktop, mobile) {
    return isMobile(chart) ? mobile : desktop;
  }
  function pointRadius(chart) {
    return responsiveValue(chart, 5, 3);
  }
  function strokeWidth(chart) {
    return responsiveValue(chart, 3, 1);
  }
  function tagName(type, elementId, label) {
    return "tag-" + type + "-" + elementId + "-" + String(label).replace(/\s+/g, "");
  }
  function isColorSchemeActive(chart) {
    return chart.config.scales.colorScheme.enabled === true;
  }
  function resolveColor(chart, colorKeyValue, fallback) {
    return isColorSchemeActive(chart) ? chart.derived.colorDiscrete(colorKeyValue) : fallback;
  }

  // inst/htmlwidgets/myIO/src/renderers/LineRenderer.js
  var LineRenderer = class {
    static type = "line";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
    static dataContract = { x_var: { required: true, numeric: true, sorted: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      var data = layer.data;
      var key = layer.label;
      var currentY = chart.newY ? chart.newY : layer.mapping.y_var;
      var transitionSpeed = chart.options.transition.speed;
      var valueLine = d3.line().curve(d3.curveMonotoneX).x(function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).y(function(d) {
        return chart.yScale(d[currentY]);
      });
      var linePath = chart.chart.selectAll("." + tagName("line", chart.element.id, key)).data([data]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("fill", "none").attr("clip-path", "url(#" + chart.element.id + "clip)").style("stroke", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      }).style("stroke-width", strokeWidth(chart)).style("opacity", 0).attr("class", tagName("line", chart.element.id, key));
      linePath.merge(newLinePath).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).style("stroke-width", strokeWidth(chart)).style("stroke", function(d) {
        return resolveColor(chart, d[0][layer.mapping.group], layer.color);
      }).attr("d", valueLine);
      this.renderPoints(chart, layer);
    }
    renderPoints(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var points = chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).data(layer.data);
      points.exit().transition().remove();
      points.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("r", pointRadius(chart)).style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      }).attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });
      points.enter().append("circle").attr("r", pointRadius(chart)).style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      }).style("opacity", 0).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      }).attr("class", tagName("point", chart.element.id, layer.label)).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1);
    }
    formatTooltip(chart, d, layer) {
      return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.label + ": " + d[chart.runtime.activeY || layer.mapping.y_var], color: layer.color, label: layer.label, value: d[chart.runtime.activeY || layer.mapping.y_var], raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("line", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("point", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/PointRenderer.js
  var PointRenderer = class {
    static type = "point";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
    static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      if (layer.mapping.low_y) {
        renderCrosshairsY(chart, layer);
      }
      if (layer.mapping.low_x) {
        renderCrosshairsX(chart, layer);
      }
      var points = chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).data(layer.data);
      points.exit().transition().remove();
      points.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("r", pointRadius(chart)).style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      }).attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });
      points.enter().append("circle").attr("r", pointRadius(chart)).style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      }).style("opacity", 0).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      }).attr("class", tagName("point", chart.element.id, layer.label)).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1);
      if (chart.options.dragPoints == true) {
        chart.dragPoints(layer);
        var color = resolveColor(chart, layer.data[layer.mapping.group], layer.color);
        setTimeout(function() {
          chart.updateRegression(color, layer.label);
        }, transitionSpeed);
      }
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("point", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.mapping.y_var + ": " + d[chart.runtime.activeY || layer.mapping.y_var], color: layer.color, label: layer.label, value: d[chart.runtime.activeY || layer.mapping.y_var], raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("point", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("crosshairX", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("crosshairY", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };
  function renderCrosshairsX(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var crosshairsX = chart.chart.selectAll("." + tagName("crosshairX", chart.element.id, layer.label)).data(layer.data);
    crosshairsX.exit().transition().remove();
    crosshairsX.transition().duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.low_x]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.high_x]);
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    });
    crosshairsX.enter().append("line").style("fill", "none").style("stroke", "black").attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0.5).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("class", tagName("crosshairX", chart.element.id, layer.label)).transition().delay(transitionSpeed).duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.low_x]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.high_x]);
    });
  }
  function renderCrosshairsY(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var crosshairsY = chart.chart.selectAll("." + tagName("crosshairY", chart.element.id, layer.label)).data(layer.data);
    crosshairsY.exit().transition().remove();
    crosshairsY.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.low_y]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.high_y]);
    });
    crosshairsY.enter().append("line").style("fill", "none").style("stroke", "black").attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0.5).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("class", tagName("crosshairY", chart.element.id, layer.label)).transition().delay(transitionSpeed).ease(d3.easeQuad).duration(transitionSpeed).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.low_y]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.high_y]);
    });
  }

  // inst/htmlwidgets/myIO/src/renderers/AreaRenderer.js
  var AreaRenderer = class {
    static type = "area";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["low_y", "high_y"], domainMerge: "union" };
    static dataContract = { x_var: { required: true, numeric: true, sorted: true }, low_y: { required: true, numeric: true }, high_y: { required: true, numeric: true } };
    render(chart, layer) {
      var data = layer.data;
      var key = layer.label;
      var transitionSpeed = chart.options.transition.speed;
      var valueArea = d3.area().curve(d3.curveMonotoneX).x(function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).y0(function(d) {
        return chart.yScale(d[layer.mapping.low_y]);
      }).y1(function(d) {
        return chart.yScale(d[layer.mapping.high_y]);
      });
      var linePath = chart.chart.selectAll("." + tagName("area", chart.element.id, key)).data([data]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
        return resolveColor(chart, d[0][layer.mapping.group], layer.color);
      }).style("opacity", 0).attr("class", tagName("area", chart.element.id, key));
      linePath.merge(newLinePath).attr("clip-path", "url(#" + chart.element.id + "clip)").transition().ease(d3.easeQuad).duration(transitionSpeed).attr("d", valueArea).style("opacity", 0.4);
    }
    formatTooltip(chart, d, layer) {
      return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.label + ": " + d[layer.mapping.high_y], color: layer.color, label: layer.label, value: d[layer.mapping.high_y], raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("area", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/BarRenderer.js
  var BarRenderer = class {
    static type = "bar";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "band", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
    static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      if (chart.options.flipAxis === true) {
        renderHorizontalBars(chart, layer);
        return;
      }
      renderVerticalBars(chart, layer);
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("bar", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.mapping.y_var + ": " + d[layer.mapping.y_var], color: layer.color, label: layer.label, value: d[layer.mapping.y_var], raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("bar", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };
  function renderVerticalBars(chart, layer) {
    var m = chart.margin;
    var data = layer.data;
    var key = layer.label;
    var barSize = layer.options.barSize == "small" ? 0.5 : 1;
    var bandwidth = chart.options.categoricalScale.xAxis == true ? (chart.width - (m.left + m.right)) / chart.x_banded.length : Math.min(100, (chart.width - (chart.margin.right + chart.margin.left)) / layer.data.length);
    var transitionSpeed = chart.options.transition.speed;
    var bars = chart.chart.selectAll("." + tagName("bar", chart.element.id, key)).data(data);
    bars.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("y", chart.yScale(0)).remove();
    var newBars = bars.enter().append("rect").attr("class", tagName("bar", chart.element.id, key)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return resolveColor(chart, d[layer.mapping.x_var], layer.color);
    }).attr("x", function(d) {
      return defineVerticalScale(chart, d, layer, bandwidth, barSize, chart.options.categoricalScale.xAxis);
    }).attr("y", chart.yScale(0)).attr("width", barSize * bandwidth - 2).attr("height", chart.yScale(0));
    bars.merge(newBars).transition().ease(d3.easeQuadOut).duration(transitionSpeed).delay(function(d, i) {
      return i * 20;
    }).attr("x", function(d) {
      return defineVerticalScale(chart, d, layer, bandwidth, barSize, chart.options.categoricalScale.xAxis);
    }).attr("y", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("width", barSize * bandwidth - 2).attr("height", function(d) {
      return chart.height - (m.top + m.bottom) - chart.yScale(d[layer.mapping.y_var]);
    });
  }
  function defineVerticalScale(chart, d, layer, bandwidth, barSize, scale) {
    switch (scale) {
      case true:
        return barSize == 1 ? chart.xScale(d[layer.mapping.x_var]) : chart.xScale(d[layer.mapping.x_var]) + bandwidth / 4;
      default:
        return barSize == 1 ? chart.xScale(d[layer.mapping.x_var]) - bandwidth / 2 : chart.xScale(d[layer.mapping.x_var]) - bandwidth / 4;
    }
  }
  function renderHorizontalBars(chart, layer) {
    var m = chart.margin;
    var data = layer.data;
    var key = layer.label;
    var barSize = layer.options.barSize == "small" ? 0.5 : 1;
    var bandwidth = chart.options.categoricalScale.yAxis == true ? (chart.height - (m.top + m.bottom)) / layer.data.length : Math.min(100, (chart.height - (chart.margin.top + chart.margin.bottom)) / layer.data.length);
    var transitionSpeed = chart.options.transition.speed;
    var bars = chart.chart.selectAll("." + tagName("bar", chart.element.id, key)).data(data);
    bars.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("width", 0).remove();
    var newBars = bars.enter().append("rect").attr("class", tagName("bar", chart.element.id, key)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return resolveColor(chart, d[layer.mapping.x_var], layer.color);
    }).attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    }).attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    }).attr("height", barSize * bandwidth - 2).attr("width", 0);
    bars.merge(newBars).transition().ease(d3.easeQuadOut).duration(transitionSpeed).delay(function(d, i) {
      return i * 20;
    }).attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    }).attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    }).attr("height", barSize * bandwidth - 2).attr("width", function(d) {
      return Math.abs(chart.xScale(d[layer.mapping.y_var]) - chart.xScale(0));
    });
  }

  // inst/htmlwidgets/myIO/src/layout/scaffold.js
  function getChartHeight(chart) {
    return chart.height;
  }
  function initializeScaffold(chart) {
    d3.select(chart.element).selectAll(".myIO-svg, .buttonDiv, .toolTip, .myIO-fab, .myIO-panel, .myIO-sheet-backdrop").remove();
    d3.select(chart.element).style("position", "relative");
    chart.svg = d3.select(chart.element).append("svg").attr("class", "myIO-svg").attr("id", "myIO-svg" + chart.element.id).attr("width", chart.totalWidth).attr("height", chart.height).attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height).attr("role", "img").attr("aria-label", buildAriaLabel(chart));
    applyPlotTransform(chart);
    chart.chart = chart.plot.append("g").attr("class", "myIO-chart-area");
  }
  function buildAriaLabel(chart) {
    var firstLayer = chart.plotLayers[0];
    if (!firstLayer) {
      return "Data visualization chart";
    }
    var chartType = firstLayer.type ? firstLayer.type.replace(/([A-Z])/g, " $1").toLowerCase() : "data visualization";
    var xLabel = chart.options.xAxisLabel || chart.options.xAxisFormat || "x-axis";
    var yLabel = chart.options.yAxisLabel || chart.options.yAxisFormat || "y-axis";
    return chartType.charAt(0).toUpperCase() + chartType.slice(1) + " chart showing " + yLabel + " by " + xLabel;
  }
  function updateScaffoldLayout(chart) {
    chart.svg.attr("width", chart.totalWidth).attr("height", chart.height).attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height);
    applyPlotTransform(chart);
    if (chart.plotLayers[0] && chart.plotLayers[0].type !== "gauge" && chart.plotLayers[0].type !== "donut" && chart.clipPath) {
      chart.clipPath.attr("x", 0).attr("y", 0).attr("width", chart.width - (chart.margin.left + chart.margin.right)).attr("height", getChartHeight(chart) - (chart.margin.top + chart.margin.bottom));
    }
  }
  function applyPlotTransform(chart) {
    var primaryType = chart.plotLayers[0] ? chart.plotLayers[0].type : null;
    switch (primaryType) {
      case "gauge":
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.width / 2 + "," + responsiveValue(chart, chart.height * 0.8, chart.height * 0.6) + ")").attr("class", "myIO-chart-offset");
        break;
      case "donut":
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.width / 2 + "," + responsiveValue(chart, chart.height, chart.height * 0.8) / 2 + ")").attr("class", "myIO-chart-offset");
        break;
      default:
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")").attr("class", "myIO-chart-offset");
    }
  }

  // inst/htmlwidgets/myIO/src/layout/axes.js
  function syncAxes(chart, state, options) {
    if (!state.axesChart) {
      return;
    }
    renderAxes(chart, { isInitialRender: options && options.isInitialRender });
  }
  function renderAxes(chart, options) {
    var m = chart.margin;
    var chartHeight = getChartHeight(chart);
    var transitionSpeed = chart.options.transition.speed;
    var xFormat = chart.options.xAxisFormat === "yearMon" ? function(x) {
      return x;
    } : d3.format(chart.options.xAxisFormat);
    var yFormat = d3.format(chart.options.yAxisFormat);
    var xAxis = chart.plot.selectAll(".x-axis").data([null]).join("g").attr("class", "x-axis");
    var yAxis = chart.plot.selectAll(".y-axis").data([null]).join("g").attr("class", "y-axis");
    var xAxisSelection = options && options.isInitialRender ? xAxis : xAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);
    switch (chart.options.categoricalScale.xAxis) {
      case true:
        xAxisSelection.attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale)).selectAll("text").attr("dx", "-.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
        break;
      case false:
        xAxisSelection.attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chartHeight - (m.top + m.bottom)))).selectAll("text").attr("dy", "1.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
    }
    applyAxisStyles(xAxis, "x");
    updateYAxis(chart, chart.yScale, yAxis, options);
  }
  function updateYAxis(chart, yScale, yAxisSelection, options) {
    var yFormat = d3.format(chart.options.yAxisFormat);
    var chartHeight = getChartHeight(chart);
    var transitionSpeed = chart.options.transition.speed;
    var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
    var yAxis = yAxisSelection || chart.plot.selectAll(".y-axis");
    var axisCall = options && options.isInitialRender ? yAxis : yAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);
    axisCall.call(d3.axisLeft(yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (chart.margin.right + chart.margin.left)))).selectAll("text").attr("dx", "-.25em");
    applyAxisStyles(chart.plot.selectAll(".y-axis"), "y");
  }
  function applyAxisStyles(axis, axisType) {
    axis.selectAll(".domain").attr("class", axisType + "-axis-line");
    axis.selectAll(".tick line").attr("class", axisType + "-grid");
    axis.selectAll("text").attr("class", axisType + "-label");
  }

  // inst/htmlwidgets/myIO/src/renderers/groupedBarHelpers.js
  function transitionGrouped(chart, data, colors, bandwidth) {
    var transitionSpeed = chart.options.transition.speed;
    updateYAxis(chart, chart.yScale);
    const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) {
      return d;
    });
    barsNew.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();
    barsNew.enter().append("rect").attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
      return chart.xScale(+d.data[0]) + bandwidth * d.idx;
    }).attr("y", chart.yScale(0)).attr("height", 0).attr("width", bandwidth).transition().ease(d3.easeQuadOut).duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("y", function(d) {
      return chart.yScale(d[1] - d[0]);
    }).attr("height", function(d) {
      return chart.yScale(0) - chart.yScale(d[1] - d[0]);
    });
    barsNew.merge(barsNew).transition().ease(d3.easeQuad).duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("x", function(d) {
      return chart.xScale(+d.data[0]) + bandwidth * d.idx;
    }).attr("width", bandwidth).transition().attr("y", function(d) {
      return chart.yScale(d[1] - d[0]);
    }).attr("height", function(d) {
      return chart.yScale(0) - chart.yScale(d[1] - d[0]);
    });
  }
  function transitionStacked(chart, data, colors, bandwidth) {
    var transitionSpeed = chart.options.transition.speed;
    var yScale = d3.scaleLinear().range(chart.yScale.range());
    var yMax = getStackedMax(data);
    yScale.domain([0, yMax * 1.1]);
    updateYAxis(chart, yScale);
    const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) {
      return d;
    });
    barsNew.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();
    barsNew.enter().append("rect").attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
      return chart.xScale(+d.data[0]);
    }).attr("y", function(d) {
      return yScale(d[1]);
    }).attr("height", 0).attr("width", bandwidth * data.length).transition().ease(d3.easeQuadOut).duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("y", function(d) {
      return yScale(d[1]);
    }).attr("height", function(d) {
      return yScale(d[0]) - yScale(d[1]);
    }).transition().attr("x", function(d) {
      return chart.xScale(+d.data[0]);
    }).attr("width", bandwidth * data.length);
    barsNew.merge(barsNew).transition().ease(d3.easeQuad).duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("y", function(d) {
      return yScale(d[1]);
    }).attr("height", function(d) {
      return yScale(d[0]) - yScale(d[1]);
    }).transition().attr("x", function(d) {
      return chart.xScale(+d.data[0]);
    }).attr("width", bandwidth * data.length);
  }
  function getGroupedDataObject(lys, chart) {
    var data = [];
    var keys = [];
    var x_var = [];
    var y_var = [];
    lys.forEach(function(d) {
      data.push(d.data);
      keys.push(d.label);
      x_var.push(d.mapping.x_var);
      y_var.push(d.mapping.y_var);
    });
    var flattenedData = [].concat.apply([], data);
    var nestedData = d3.group(flattenedData, function(d) {
      return d[x_var[0]];
    });
    var groupedKeys = [...Array(keys.length).keys()];
    var currentY = chart.newY ? chart.newY : y_var[0];
    var groupedData = d3.stack().keys(groupedKeys).value(function(d, key) {
      return d[1][key] == void 0 ? 0 : d[1][key][currentY];
    })(nestedData);
    groupedData.forEach(function(d, i) {
      d.forEach(function(e) {
        e.idx = i;
      });
    });
    return groupedData;
  }
  function getStackedMax(data) {
    return d3.max(data[data.length - 1], function(d) {
      return d[1];
    });
  }

  // inst/htmlwidgets/myIO/src/renderers/GroupedBarRenderer.js
  var GroupedBarRenderer = class {
    static type = "groupedBar";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "band", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
    static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true }, group: { required: true } };
    render(chart, layer, layers) {
      var lys = layers || [layer];
      var data = getGroupedDataObject(lys, chart);
      var colors = lys.map(function(d) {
        return d.color;
      });
      var bandwidth = (chart.width - (chart.margin.right + chart.margin.left)) / data[0].length / colors.length;
      if (typeof chart.layout == "undefined") {
        chart.layout = "grouped";
      }
      const bars = chart.chart.selectAll("g").data(data);
      bars.exit().remove();
      bars.enter().append("g").style("fill", function(d, i) {
        return resolveColor(chart, d[layer.mapping.group], colors[i]);
      }).attr("class", "tag-grouped-bar-g");
      bars.merge(bars).style("fill", function(d, i) {
        return resolveColor(chart, d[layer.mapping.group], colors[i]);
      }).call(function() {
        if (chart.layout === "grouped") {
          transitionGrouped(chart, data, colors, bandwidth);
        } else {
          transitionStacked(chart, data, colors, bandwidth);
        }
      });
    }
    getHoverSelector() {
      return ".tag-grouped-bar-g rect";
    }
    formatTooltip(chart, d, layer) {
      return { title: layer.mapping.x_var + ": " + d.data[0], body: layer.mapping.y_var + ": " + (d[1] - d[0]), color: layer.color, label: layer.label, value: d[1] - d[0], raw: d };
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".tag-grouped-bar-g").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/HistogramRenderer.js
  var HistogramRenderer = class {
    static type = "histogram";
    static traits = { hasAxes: true, referenceLines: false, legendType: "layer", binning: true, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["value"], domainMerge: "union" };
    static dataContract = { value: { required: true, numeric: true } };
    render(chart, layer) {
      var data = layer.bins;
      var key = layer.label;
      var transitionSpeed = chart.options.transition.speed;
      var bars = chart.chart.selectAll("." + tagName("bar", chart.element.id, key)).data(data);
      bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();
      var newBars = bars.enter().append("rect").attr("class", tagName("bar", chart.element.id, key)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function() {
        return resolveColor(chart, layer.label, layer.color);
      }).attr("x", function(d) {
        return chart.xScale(d.x0) + 1;
      }).attr("y", chart.yScale(0)).attr("width", function(d) {
        return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1);
      }).attr("height", chart.yScale(0));
      bars.merge(newBars).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x", function(d) {
        return chart.xScale(d.x0) + 1;
      }).attr("width", function(d) {
        return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1);
      }).attr("y", function(d) {
        return chart.yScale(d.length);
      }).attr("height", function(d) {
        return chart.yScale(0) - chart.yScale(d.length);
      });
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("bar", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return { title: "Bin: " + d.x0 + " to " + d.x1, body: "Count: " + d.length, color: layer.color, label: "count", value: d.length, raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("bar", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/HexbinRenderer.js
  var HexbinRenderer = class {
    static type = "hexbin";
    static traits = { hasAxes: true, referenceLines: false, legendType: "continuous", binning: false, rolloverStyle: "hex", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
    static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true }, radius: { required: true, numeric: true, positive: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var points = layer.data.map(function(d) {
        return { 0: chart.xScale(+d[layer.mapping.x_var]), 1: chart.yScale(+d[layer.mapping.y_var]) };
      }).sort(function(d) {
        return d3.ascending(d.index);
      });
      var x_extent = d3.extent(layer.data, function(d) {
        return +d[layer.mapping.x_var];
      });
      var y_extent = d3.extent(layer.data, function(d) {
        return +d[layer.mapping.y_var];
      });
      var radius = typeof layer.mapping.radius === "number" ? layer.mapping.radius : +layer.mapping.radius;
      var hexbin = d3.hexbin().radius(radius * (Math.min(chart.width, chart.height) / 1e3)).extent([[x_extent[0], y_extent[0]], [x_extent[1], y_extent[1]]]);
      var binnedData = hexbin(points);
      chart.colorContinuous = d3.scaleSequential(d3.interpolateBuPu).domain([0, d3.max(binnedData, function(d) {
        return d.length;
      })]);
      var bins = chart.chart.attr("clip-path", "url(#" + chart.element.id + "clip)").selectAll("." + tagName("hexbin", chart.element.id, layer.label)).data(binnedData);
      bins.exit().transition().duration(transitionSpeed).remove();
      var newbins = bins.enter().append("path").attr("class", tagName("hexbin", chart.element.id, layer.label)).attr("d", hexbin.hexagon()).attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).attr("fill", "white");
      bins.merge(newbins).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("d", hexbin.hexagon()).attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).attr("fill", function(d) {
        return chart.colorContinuous(d.length);
      });
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("hexbin", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d) {
      return { title: "x: " + chart.derived.xScale.invert(d.x) + ", y: " + chart.derived.yScale.invert(d.y), body: "Count: " + d.length, color: chart.derived.colorContinuous(d.length), label: "count", value: d.length, raw: d };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("hexbin", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/utils/export-csv.js
  function exportToCsv(filename, rows) {
    var jsonObject = JSON.stringify(rows);
    function convertToCSV(objArray) {
      var array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
      var names = Object.keys(array[0]).toString();
      var str = names + "\r\n";
      for (var i = 0; i < array.length; i++) {
        var line = "";
        for (var index in array[i]) {
          if (line !== "") line += ",";
          line += array[i][index];
        }
        str += line + "\r\n";
      }
      return str;
    }
    var csvFile = convertToCSV(jsonObject);
    var blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    if (link.download !== void 0) {
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // inst/htmlwidgets/myIO/src/utils/export-svg.js
  function getSVGString(svgNode) {
    svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
    var cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);
    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink=");
    svgString = svgString.replace(/NS\d+:href/g, "xlink:href");
    return svgString;
    function getCSSStyles(parentElement) {
      var selectorTextArr = collectSelectors(parentElement);
      var nodes = parentElement.getElementsByTagName("*");
      for (var i = 0; i < nodes.length; i++) {
        selectorTextArr = selectorTextArr.concat(collectSelectors(nodes[i]));
      }
      var extractedCSSText = "";
      for (var k = 0; k < document.styleSheets.length; k++) {
        var s = document.styleSheets[k];
        try {
          if (!s.cssRules) continue;
        } catch (e) {
          if (e.name !== "SecurityError") throw e;
          continue;
        }
        var cssRules = s.cssRules;
        for (var r = 0; r < cssRules.length; r++) {
          var rule = cssRules[r];
          if (rule.type === CSSRule.FONT_FACE_RULE || rule.selectorText === ":root") {
            extractedCSSText += rule.cssText;
            continue;
          }
          if (matchesRule(rule, parentElement, selectorTextArr)) {
            extractedCSSText += rule.cssText;
          }
        }
      }
      return extractedCSSText;
      function collectSelectors(node) {
        var selectors = [];
        if (node.id) {
          selectors.push("#" + node.id);
        }
        if (node.classList) {
          for (var c = 0; c < node.classList.length; c++) {
            selectors.push("." + node.classList[c]);
          }
        }
        return selectors;
      }
      function matchesRule(rule2, rootNode, selectorList) {
        if (!rule2.selectorText) {
          return false;
        }
        return rule2.selectorText.split(",").some(function(selector) {
          var trimmed = selector.trim();
          if (selectorList.indexOf(trimmed) !== -1) {
            return true;
          }
          try {
            return !!rootNode.querySelector(trimmed);
          } catch (e) {
            return false;
          }
        });
      }
    }
    function appendCSS(cssText, element) {
      var styleElement = document.createElement("style");
      styleElement.setAttribute("type", "text/css");
      styleElement.innerHTML = cssText;
      var refNode = element.hasChildNodes() ? element.children[0] : null;
      element.insertBefore(styleElement, refNode);
    }
  }
  function svgString2Image(svgString, width, height, format, callback) {
    var imageFormat = format || "png";
    var imgsrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    var image = new Image();
    image.onload = function() {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(function(blob) {
        var filesize = Math.round(blob.length / 1024) + " KB";
        if (callback) callback(blob, filesize, imageFormat);
      });
    };
    image.src = imgsrc;
  }

  // inst/htmlwidgets/myIO/src/utils/file-saver.js
  var saveAs = saveAs || (function(e) {
    "use strict";
    if ("undefined" == typeof navigator || !/MSIE [1-9]\./.test(navigator.userAgent)) {
      var t = e.document, n = function() {
        return e.URL || e.webkitURL || e;
      }, o = t.createElementNS("http://www.w3.org/1999/xhtml", "a"), r = "download" in o, i = function(e2) {
        var t2 = new MouseEvent("click");
        e2.dispatchEvent(t2);
      }, a = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent), c = e.webkitRequestFileSystem, d = e.requestFileSystem || c || e.mozRequestFileSystem, u = function(t2) {
        (e.setImmediate || e.setTimeout)(function() {
          throw t2;
        }, 0);
      }, s = "application/octet-stream", f = 0, l = 4e4, v = function(e2) {
        var t2 = function() {
          "string" == typeof e2 ? n().revokeObjectURL(e2) : e2.remove();
        };
        setTimeout(t2, l);
      }, p = function(e2, t2, n2) {
        t2 = [].concat(t2);
        for (var o2 = t2.length; o2--; ) {
          var r2 = e2["on" + t2[o2]];
          if ("function" == typeof r2) try {
            r2.call(e2, n2 || e2);
          } catch (i2) {
            u(i2);
          }
        }
      }, w = function(e2) {
        return /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e2.type) ? new Blob(["\uFEFF", e2], { type: e2.type }) : e2;
      }, y = function(t2, u2, l2) {
        l2 || (t2 = w(t2));
        var y2, m2, S2, h = this, R = t2.type, O = false, g = function() {
          p(h, "writestart progress write writeend".split(" "));
        }, b = function() {
          if (m2 && a && "undefined" != typeof FileReader) {
            var o2 = new FileReader();
            return o2.onloadend = function() {
              var e2 = o2.result;
              m2.location.href = "data:attachment/file" + e2.slice(e2.search(/[,;]/)), h.readyState = h.DONE, g();
            }, o2.readAsDataURL(t2), void (h.readyState = h.INIT);
          }
          if ((O || !y2) && (y2 = n().createObjectURL(t2)), m2) m2.location.href = y2;
          else {
            var r2 = e.open(y2, "_blank");
            void 0 === r2 && a && (e.location.href = y2);
          }
          h.readyState = h.DONE, g(), v(y2);
        }, E = function(e2) {
          return function() {
            return h.readyState !== h.DONE ? e2.apply(this, arguments) : void 0;
          };
        }, N = { create: true, exclusive: false };
        return h.readyState = h.INIT, u2 || (u2 = "download"), r ? (y2 = n().createObjectURL(t2), void setTimeout(function() {
          o.href = y2, o.download = u2, i(o), g(), v(y2), h.readyState = h.DONE;
        })) : (e.chrome && R && R !== s && (S2 = t2.slice || t2.webkitSlice, t2 = S2.call(t2, 0, t2.size, s), O = true), c && "download" !== u2 && (u2 += ".download"), (R === s || c) && (m2 = e), d ? (f += t2.size, void d(e.TEMPORARY, f, E(function(e2) {
          e2.root.getDirectory("saved", N, E(function(e3) {
            var n2 = function() {
              e3.getFile(u2, N, E(function(e4) {
                e4.createWriter(E(function(n3) {
                  n3.onwriteend = function(t3) {
                    m2.location.href = e4.toURL(), h.readyState = h.DONE, p(h, "writeend", t3), v(e4);
                  }, n3.onerror = function() {
                    var e5 = n3.error;
                    e5.code !== e5.ABORT_ERR && b();
                  }, "writestart progress write abort".split(" ").forEach(function(e5) {
                    n3["on" + e5] = h["on" + e5];
                  }), n3.write(t2), h.abort = function() {
                    n3.abort(), h.readyState = h.DONE;
                  }, h.readyState = h.WRITING;
                }), b);
              }), b);
            };
            e3.getFile(u2, { create: false }, E(function(e4) {
              e4.remove(), n2();
            }), E(function(e4) {
              e4.code === e4.NOT_FOUND_ERR ? n2() : b();
            }));
          }), b);
        }), b)) : void b());
      }, m = y.prototype, S = function(e2, t2, n2) {
        return new y(e2, t2, n2);
      };
      return "undefined" != typeof navigator && navigator.msSaveOrOpenBlob ? function(e2, t2, n2) {
        return n2 || (e2 = w(e2)), navigator.msSaveOrOpenBlob(e2, t2 || "download");
      } : (m.abort = function() {
        var e2 = this;
        e2.readyState = e2.DONE, p(e2, "abort");
      }, m.readyState = m.INIT = 0, m.WRITING = 1, m.DONE = 2, m.error = m.onwritestart = m.onprogress = m.onwrite = m.onabort = m.onerror = m.onwriteend = null, S);
    }
  })("undefined" != typeof self && self || "undefined" != typeof window && window || (void 0).content);

  // inst/htmlwidgets/myIO/src/interactions/buttons.js
  var BUTTON_LABELS = {
    image: "Export as PNG",
    chart: "Download CSV data",
    percent: "Toggle percent view",
    group2stack: "Toggle grouped/stacked layout"
  };
  function handleAction(chart, layers, name) {
    if (name === "image") {
      var svgString = getSVGString(chart.svg.node());
      svgString2Image(svgString, 2 * chart.width, 2 * chart.height, "png", function(dataBlob) {
        saveAs(dataBlob, chart.element.id + ".png");
      });
      return;
    }
    if (name === "chart") {
      var csvData = [];
      chart.plotLayers.forEach(function(layer) {
        csvData.push(layer.data);
      });
      exportToCsv(chart.element.id + "_data.csv", [].concat.apply([], csvData));
      return;
    }
    if (name === "percent") {
      var nextToggle = chart.runtime.activeY === chart.options.toggleY[0] ? [chart.plotLayers[0].mapping.y_var, chart.options.yAxisFormat] : chart.options.toggleY;
      chart.toggleVarY(nextToggle);
      return;
    }
    if (name === "group2stack") {
      chart.toggleGroupedLayout(layers);
    }
  }
  function iconWrapper(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">' + paths + "</svg>";
  }
  function iconCamera() {
    return iconWrapper('<path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"></path><circle cx="12" cy="13" r="4"></circle>');
  }
  function iconFileDown() {
    return iconWrapper('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="m9 15 3 3 3-3"></path>');
  }
  function iconPercent() {
    return iconWrapper('<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="17" r="2"></circle>');
  }
  function iconLayers() {
    return iconWrapper('<rect x="4" y="5" width="14" height="4" rx="1"></rect><rect x="6" y="10" width="14" height="4" rx="1"></rect><rect x="8" y="15" width="14" height="4" rx="1"></rect>');
  }

  // inst/htmlwidgets/myIO/src/layout/legend-data.js
  function buildLegendData(chart, state) {
    if (!chart || !chart.plotLayers || chart.plotLayers.length === 0) {
      return null;
    }
    if (chart.options && chart.options.suppressLegend === true) {
      return null;
    }
    var renderState = state || {};
    if (renderState.continuousLegend) {
      return buildContinuousLegendData(chart);
    }
    if (renderState.ordinalLegend) {
      var ordinalLayer = (chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers)[0] || chart.plotLayers[0];
      return buildOrdinalLegendData(chart, ordinalLayer);
    }
    return buildLayerLegendData(chart);
  }
  function buildOrdinalLegendData(chart, layer) {
    if (!layer) {
      return null;
    }
    if (!chart.runtime) {
      chart.runtime = {};
    }
    if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
      chart.runtime._hiddenOrdinalSegments = [];
    }
    var hidden = chart.runtime._hiddenOrdinalSegments;
    var keys = [];
    if (layer.type === "treemap" && layer.data && layer.data.children) {
      keys = layer.data.children.map(function(d) {
        return d.name;
      });
    } else if (layer.type === "donut" && Array.isArray(layer.data)) {
      keys = layer.data.map(function(d) {
        return d[layer.mapping.x_var];
      });
    }
    return {
      type: "ordinal",
      items: keys.map(function(key) {
        var swatchColor = "#6b7280";
        if (typeof chart.colorDiscrete === "function") {
          swatchColor = layer.type === "treemap" ? chart.colorDiscrete("treemap." + key) : chart.colorDiscrete(key);
        }
        if (!swatchColor) {
          swatchColor = "#6b7280";
        }
        return {
          key,
          label: key,
          color: swatchColor,
          visible: hidden.indexOf(key) === -1,
          kind: "segment"
        };
      })
    };
  }
  function buildLayerLegendData(chart) {
    var currentLayers = chart.currentLayers || chart.derived && chart.derived.currentLayers || [];
    var visibleKeys = currentLayers.map(function(layer) {
      return layer._composite || layer.label;
    });
    var hiddenKeys = Array.isArray(chart.runtime && chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys : [];
    return {
      type: "layer",
      items: (chart.plotLayers || []).map(function(layer) {
        var key = layer._composite || layer.label;
        return {
          key,
          label: layer.label,
          color: layer.color || "#6b7280",
          visible: visibleKeys.indexOf(key) > -1 && hiddenKeys.indexOf(key) === -1,
          kind: layer.type
        };
      })
    };
  }
  function buildContinuousLegendData(chart) {
    var scale = chart.colorContinuous || chart.derived && chart.derived.colorContinuous;
    return {
      type: "continuous",
      items: [],
      colorScale: scale || null,
      domain: scale && typeof scale.domain === "function" ? scale.domain() : null
    };
  }

  // inst/htmlwidgets/myIO/src/interactions/bottom-sheet.js
  var PANEL_OPEN_CLASS = "myIO-panel--open";
  var BACKDROP_OPEN_CLASS = "myIO-sheet-backdrop--open";
  var PANEL_LAYOUT_BOTTOM_CLASS = "myIO-panel--bottom";
  var PANEL_LAYOUT_SIDE_CLASS = "myIO-panel--side";
  function addFAB(chart) {
    if (!chart || !chart.element) {
      return null;
    }
    d3.select(chart.element).select(".myIO-fab").remove();
    if (isEmptyChart(chart)) {
      return null;
    }
    chart.dom = chart.dom || {};
    var fab = d3.select(chart.element).append("button").attr("type", "button").attr("class", "myIO-fab").attr("aria-label", "Open chart controls").attr("aria-expanded", "false").html(iconMore());
    fab.on("click", function() {
      openPanel(chart);
    });
    fab.on("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPanel(chart);
      }
    });
    chart.dom.fab = fab;
    syncFABState(chart);
    return fab;
  }
  function openPanel(chart) {
    if (!chart || !chart.element) {
      return null;
    }
    chart.dom = chart.dom || {};
    chart.runtime = chart.runtime || {};
    if (chart.runtime._sheetCloseTimer) {
      clearTimeout(chart.runtime._sheetCloseTimer);
      chart.runtime._sheetCloseTimer = null;
    }
    if (chart.runtime._sheetOpen) {
      return chart.dom.panel || null;
    }
    cleanupPanelNodes(chart);
    var backdrop = d3.select(chart.element).append("div").attr("class", "myIO-sheet-backdrop").attr("aria-hidden", "true").on("click", function() {
      closePanel(chart);
    });
    var panel = d3.select(chart.element).append("div").attr("class", "myIO-panel " + (isMobile(chart) ? PANEL_LAYOUT_BOTTOM_CLASS : PANEL_LAYOUT_SIDE_CLASS)).attr("role", "dialog").attr("aria-modal", "true").attr("aria-label", getDialogLabel(chart)).attr("tabindex", "-1");
    panel.append("div").attr("class", "myIO-sheet-handle");
    chart.dom.backdrop = backdrop;
    chart.dom.panel = panel;
    chart.dom.sheetLegendSection = null;
    chart.dom.sheetLegendBody = null;
    chart.dom.sheetActionsSection = null;
    chart.dom.sheetActionsBody = null;
    if (!chart.options || chart.options.suppressLegend !== true) {
      var legendSection = panel.append("section").attr("class", "myIO-sheet-section myIO-sheet-legend-section").attr("data-sheet-section", "legend");
      legendSection.append("h2").attr("class", "myIO-sheet-section-title").text("Legend");
      chart.dom.sheetLegendSection = legendSection;
      chart.dom.sheetLegendBody = legendSection.append("div").attr("class", "myIO-sheet-legend");
    }
    var actionSection = panel.append("section").attr("class", "myIO-sheet-section myIO-sheet-actions-section").attr("data-sheet-section", "actions");
    actionSection.append("h2").attr("class", "myIO-sheet-section-title").text("Actions");
    chart.dom.sheetActionsSection = actionSection;
    chart.dom.sheetActionsBody = actionSection.append("div").attr("class", "myIO-sheet-actions");
    renderSheetLegend(chart);
    renderSheetActions(chart);
    chart.runtime._sheetOpen = true;
    attachSheetKeydown(chart);
    syncFABState(chart);
    window.requestAnimationFrame(function() {
      backdrop.classed(BACKDROP_OPEN_CLASS, true);
      panel.classed(PANEL_OPEN_CLASS, true);
      focusFirstInteractive(panel.node());
    });
    return panel;
  }
  function closePanel(chart, opts) {
    if (!chart || !chart.dom) {
      return;
    }
    var options = opts || {};
    if (!chart.runtime) {
      chart.runtime = {};
    }
    if (chart.runtime._sheetCloseTimer) {
      clearTimeout(chart.runtime._sheetCloseTimer);
      chart.runtime._sheetCloseTimer = null;
    }
    if (chart.dom.backdrop) {
      chart.dom.backdrop.classed(BACKDROP_OPEN_CLASS, false);
    }
    if (chart.dom.panel) {
      chart.dom.panel.classed(PANEL_OPEN_CLASS, false);
    }
    detachSheetKeydown(chart);
    chart.runtime._sheetOpen = false;
    syncFABState(chart);
    var finalize = function() {
      cleanupPanelNodes(chart);
      chart.runtime._sheetCloseTimer = null;
      syncFABState(chart);
      if (options.returnFocus !== false && chart.dom.fab && typeof chart.dom.fab.node === "function" && chart.dom.fab.node()) {
        chart.dom.fab.node().focus();
      }
    };
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finalize();
      return;
    }
    var panelNode = chart.dom.panel && chart.dom.panel.node ? chart.dom.panel.node() : null;
    var backdropNode = chart.dom.backdrop && chart.dom.backdrop.node ? chart.dom.backdrop.node() : null;
    if (!panelNode || !backdropNode) {
      finalize();
      return;
    }
    var finalized = false;
    var cleanup = function() {
      if (finalized) {
        return;
      }
      finalized = true;
      finalize();
    };
    panelNode.addEventListener("transitionend", cleanup, { once: true });
    backdropNode.addEventListener("transitionend", cleanup, { once: true });
    chart.runtime._sheetCloseTimer = window.setTimeout(cleanup, 350);
  }
  function renderSheetLegend(chart) {
    if (!chart || !chart.dom || !chart.dom.panel) {
      return;
    }
    var legendSection = chart.dom.sheetLegendSection;
    var legendBody = chart.dom.sheetLegendBody;
    if (!legendSection || !legendBody) {
      return;
    }
    var panelNode = chart.dom.panel.node();
    var scrollTop = panelNode ? panelNode.scrollTop : 0;
    var legendData = getLegendData(chart);
    legendBody.selectAll("*").remove();
    if (!legendData || !legendData.type) {
      legendSection.style("display", "none");
      if (panelNode) {
        panelNode.scrollTop = scrollTop;
      }
      return;
    }
    legendSection.style("display", null);
    if (legendData.type === "continuous") {
      renderContinuousLegend(chart, legendBody, legendData);
    } else if (legendData.type === "ordinal") {
      renderOrdinalLegend(chart, legendBody, legendData);
    } else {
      renderLayerLegend(chart, legendBody, legendData);
    }
    if (panelNode) {
      panelNode.scrollTop = scrollTop;
    }
  }
  function renderSheetActions(chart) {
    if (!chart.dom || !chart.dom.sheetActionsBody) {
      return;
    }
    var actions = buildActionData(chart);
    var body = chart.dom.sheetActionsBody;
    body.selectAll("*").remove();
    actions.forEach(function(action) {
      var button = body.append("button").attr("type", "button").attr("class", "button myIO-sheet-action").attr("data-action", action.name).attr("aria-label", action.label).on("click", function() {
        handleAction(chart, chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || [], action.name);
      });
      button.append("span").attr("class", "myIO-sheet-action-icon").attr("aria-hidden", "true").html(action.icon);
      button.append("span").attr("class", "myIO-sheet-action-label").text(action.label);
    });
  }
  function renderLayerLegend(chart, container, legendData) {
    legendData.items.forEach(function(item) {
      var button = container.append("button").attr("type", "button").attr("class", "myIO-sheet-legend-item").attr("role", "switch").attr("aria-checked", item.visible ? "true" : "false").attr("data-key", item.key).on("click", function() {
        toggleLayerVisibility(chart, item);
      }).on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleLayerVisibility(chart, item);
        }
      });
      button.append("span").attr("class", "myIO-sheet-swatch").style("background-color", item.color).style("border", "1px solid " + item.color);
      button.append("span").attr("class", "myIO-sheet-legend-label").text(item.label);
      button.append("span").attr("class", "myIO-sheet-legend-state").text(item.visible ? "On" : "Off");
    });
  }
  function renderOrdinalLegend(chart, container, legendData) {
    legendData.items.forEach(function(item) {
      var button = container.append("button").attr("type", "button").attr("class", "myIO-sheet-legend-item").attr("role", "switch").attr("aria-checked", item.visible ? "true" : "false").attr("data-key", item.key).on("click", function() {
        toggleOrdinalSegment(chart, item);
      }).on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleOrdinalSegment(chart, item);
        }
      });
      button.append("span").attr("class", "myIO-sheet-swatch").style("background-color", item.color).style("border", "1px solid " + item.color);
      button.append("span").attr("class", "myIO-sheet-legend-label").text(item.label);
      button.append("span").attr("class", "myIO-sheet-legend-state").text(item.visible ? "On" : "Off");
    });
  }
  function renderContinuousLegend(chart, container, legendData) {
    var scale = legendData.colorScale || chart.colorContinuous;
    if (!scale) {
      return;
    }
    var domain = legendData.domain || scale.domain();
    var stops = buildGradientStops(scale, domain);
    var ticks = buildContinuousTicks(scale, domain);
    container.append("div").attr("class", "myIO-sheet-gradient").style("background", "linear-gradient(90deg, " + stops + ")");
    var tickRow = container.append("div").attr("class", "myIO-sheet-gradient-ticks");
    ticks.forEach(function(tick) {
      tickRow.append("span").text(tick);
    });
  }
  function buildActionData(chart) {
    var layers = chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || [];
    var primaryType = layers[0] ? layers[0].type : null;
    var data = [
      { name: "image", label: BUTTON_LABELS.image, icon: iconCamera() },
      { name: "chart", label: BUTTON_LABELS.chart, icon: iconFileDown() }
    ];
    if (chart.options && chart.options.toggleY) {
      data.push({ name: "percent", label: BUTTON_LABELS.percent, icon: iconPercent() });
    }
    if (chart.options && chart.options.toggleY && primaryType === "groupedBar") {
      data.push({ name: "group2stack", label: BUTTON_LABELS.group2stack, icon: iconLayers() });
    }
    return data;
  }
  function toggleLayerVisibility(chart, item) {
    if (!chart.runtime) {
      chart.runtime = {};
    }
    var hiddenKeys = Array.isArray(chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys.slice() : [];
    var index = hiddenKeys.indexOf(item.key);
    if (index === -1) {
      hiddenKeys.push(item.key);
    } else {
      hiddenKeys.splice(index, 1);
    }
    chart.runtime._hiddenLayerKeys = hiddenKeys;
    chart.derived = chart.derived || {};
    chart.derived.currentLayers = (chart.plotLayers || []).filter(function(layer) {
      return hiddenKeys.indexOf(layer._composite || layer.label) === -1;
    });
    chart.syncLegacyAliases();
    chart.renderCurrentLayers();
  }
  function toggleOrdinalSegment(chart, item) {
    if (!chart.runtime) {
      chart.runtime = {};
    }
    if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
      chart.runtime._hiddenOrdinalSegments = [];
    }
    var hidden = chart.runtime._hiddenOrdinalSegments;
    var index = hidden.indexOf(item.key);
    if (index === -1) {
      hidden.push(item.key);
    } else {
      hidden.splice(index, 1);
    }
    chart.runtime._suppressOrdinalLegendRebuild = true;
    chart.routeLayers(chart.currentLayers || chart.derived && chart.derived.currentLayers || []);
    chart.runtime._suppressOrdinalLegendRebuild = false;
  }
  function getLegendData(chart) {
    if (chart.runtime && chart.runtime._legendData) {
      return chart.runtime._legendData;
    }
    return buildLegendData(chart, chart.runtime && chart.runtime._legendState);
  }
  function syncFABState(chart) {
    if (!chart || !chart.dom || !chart.dom.fab) {
      return;
    }
    var isOpen = chart.runtime && chart.runtime._sheetOpen === true;
    chart.dom.fab.attr("aria-expanded", isOpen ? "true" : "false").attr("aria-label", isOpen ? "Close chart controls" : "Open chart controls").html(isOpen ? iconClose() : iconMore());
  }
  function attachSheetKeydown(chart) {
    detachSheetKeydown(chart);
    var handler = function(event) {
      if (!chart.runtime || !chart.runtime._sheetOpen || !chart.dom || !chart.dom.panel) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel(chart);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      var focusables = getFocusableElements(chart.dom.panel.node());
      if (focusables.length === 0) {
        event.preventDefault();
        chart.dom.panel.node().focus();
        return;
      }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    chart.runtime._sheetEscHandler = handler;
    document.addEventListener("keydown", handler);
  }
  function detachSheetKeydown(chart) {
    if (!chart || !chart.runtime || !chart.runtime._sheetEscHandler) {
      return;
    }
    document.removeEventListener("keydown", chart.runtime._sheetEscHandler);
    chart.runtime._sheetEscHandler = null;
  }
  function cleanupPanelNodes(chart) {
    if (chart.dom && chart.dom.panel && typeof chart.dom.panel.remove === "function") {
      chart.dom.panel.remove();
    }
    if (chart.dom && chart.dom.backdrop && typeof chart.dom.backdrop.remove === "function") {
      chart.dom.backdrop.remove();
    }
    if (chart.dom) {
      chart.dom.panel = null;
      chart.dom.backdrop = null;
      chart.dom.sheetLegendSection = null;
      chart.dom.sheetLegendBody = null;
      chart.dom.sheetActionsSection = null;
      chart.dom.sheetActionsBody = null;
    }
  }
  function isEmptyChart(chart) {
    var layers = chart && (chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || []);
    return !layers || layers.length === 0;
  }
  function getDialogLabel(chart) {
    if (chart && chart.svg && typeof chart.svg.attr === "function") {
      var baseLabel = chart.svg.attr("aria-label");
      if (baseLabel) {
        return baseLabel + " controls";
      }
    }
    return "Chart controls";
  }
  function focusFirstInteractive(rootNode) {
    if (!rootNode) {
      return;
    }
    var focusables = getFocusableElements(rootNode);
    if (focusables.length > 0) {
      focusables[0].focus();
      return;
    }
    rootNode.focus();
  }
  function getFocusableElements(rootNode) {
    if (!rootNode) {
      return [];
    }
    return Array.from(rootNode.querySelectorAll([
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",")));
  }
  function buildGradientStops(scale, domain) {
    var min = domain[0];
    var max = domain[domain.length - 1];
    var steps = 8;
    return Array.from({ length: steps }, function(_, index) {
      var t = steps === 1 ? 0 : index / (steps - 1);
      var value = min + (max - min) * t;
      return scale(value) + " " + Math.round(t * 100) + "%";
    }).join(", ");
  }
  function buildContinuousTicks(scale, domain) {
    if (typeof scale.ticks === "function") {
      return scale.ticks(5).map(function(tick) {
        return String(tick);
      });
    }
    return [String(domain[0]), String(domain[domain.length - 1])];
  }
  function iconWrapper2(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">' + paths + "</svg>";
  }
  function iconMore() {
    return iconWrapper2('<circle cx="12" cy="5" r="1.75"></circle><circle cx="12" cy="12" r="1.75"></circle><circle cx="12" cy="19" r="1.75"></circle>');
  }
  function iconClose() {
    return iconWrapper2('<path d="M6 6 18 18"></path><path d="M18 6 6 18"></path>');
  }

  // inst/htmlwidgets/myIO/src/layout/legend.js
  function syncLegend(chart, state) {
    if (!chart || !chart.runtime) {
      return;
    }
    if (chart.options && chart.options.suppressLegend === true) {
      return;
    }
    chart.runtime._legendState = state || null;
    chart.runtime._legendData = buildLegendData(chart, state);
    if (chart.runtime._sheetOpen) {
      renderSheetLegend(chart);
    }
  }
  function syncOrdinalLegendData(chart, layer) {
    if (!chart || !chart.runtime || chart.runtime._suppressOrdinalLegendRebuild) {
      return;
    }
    chart.runtime._legendState = { ordinalLegend: true };
    chart.runtime._legendData = buildOrdinalLegendData(chart, layer);
    if (chart.runtime._sheetOpen) {
      renderSheetLegend(chart);
    }
  }

  // inst/htmlwidgets/myIO/src/renderers/TreemapRenderer.js
  var TreemapRenderer = class {
    static type = "treemap";
    static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
    static scaleHints = null;
    static dataContract = { level_1: { required: true }, level_2: { required: true }, y_var: { required: false, numeric: true } };
    render(chart, layer) {
      var m = chart.margin;
      var format = d3.format(",d");
      var key = layer.label;
      if (isColorSchemeActive(chart)) {
        chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
        chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      } else {
        var colorKey = layer.data.children.map(function(d) {
          return d.name;
        });
        chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(colorKey);
      }
      var root = d3.hierarchy(layer.data).eachBefore(function(d) {
        d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
      }).sum(function(d) {
        return d[layer.mapping.y_var];
      }).sort(function(a, b) {
        return b.height - a.height || b.value - a.value;
      });
      d3.treemap().tile(d3.treemapResquarify).size([chart.width - (m.left + m.right), getChartHeight(chart) - (m.top + m.bottom)]).round(true).paddingInner(1)(root);
      var cell = chart.chart.selectAll(".root").data(root.leaves());
      cell.exit().remove();
      var newCell = cell.enter().append("g").attr("class", "root").attr("transform", function(d) {
        return "translate(" + d.x0 + "," + d.y0 + ")";
      });
      newCell.append("rect").attr("class", tagName("tree", chart.element.id, key)).attr("id", function(d) {
        return d.data.id;
      }).attr("width", function(d) {
        return d.x1 - d.x0;
      }).attr("height", function(d) {
        return d.y1 - d.y0;
      }).attr("fill", function(d) {
        while (d.depth > 1) d = d.parent;
        return chart.colorDiscrete(d.data.id);
      });
      cell.merge(newCell).transition().duration(750).ease(d3.easeQuad).attr("transform", function(d) {
        return "translate(" + d.x0 + "," + d.y0 + ")";
      }).select("rect").attr("width", function(d) {
        return d.x1 - d.x0;
      }).attr("height", function(d) {
        return d.y1 - d.y0;
      }).attr("fill", function(d) {
        while (d.depth > 1) d = d.parent;
        return chart.colorDiscrete(d.data.id);
      });
      newCell.append("text").attr("class", "inner-text").selectAll("tspan").data(function(d) {
        return d.data[layer.mapping.x_var][0].split(/(?=[A-Z][^A-Z])/g).concat(format(d.value));
      }).enter().append("tspan").attr("x", 3).attr("y", function(d, i, nodes) {
        return (i === nodes.length - 1) * 3 + 16 + (i - 0.5) * 9;
      }).attr("fill-opacity", function(d, i) {
        return this.parentNode.parentNode.getBBox().width > 40 ? 1 : 0;
      }).attr("fill", "black").text(function(d) {
        return d;
      });
      newCell.append("title").text(function(d) {
        return d.data[layer.mapping.level_1] + "  \n" + d.data[layer.mapping.level_2] + " \n" + d.data[layer.mapping.x_var] + "  \n" + format(d.value);
      });
      cell.selectAll("text").remove();
      cell.append("text").selectAll("tspan").data(function(d) {
        return d.data[layer.mapping.x_var][0].split(/(?=[A-Z][^A-Z])/g).concat(format(d.value));
      }).enter().append("tspan").attr("x", 3).attr("y", function(d, i, nodes) {
        return (i === nodes.length - 1) * 3 + 16 + (i - 0.5) * 9;
      }).attr("fill-opacity", function(d, i) {
        return this.parentNode.parentNode.getBBox().width > 40 ? 1 : 0;
      }).attr("fill", "black").text(function(d) {
        return d;
      });
      cell.select("title").text(function(d) {
        return d.data[layer.mapping.level_1] + "  \n" + d.data[layer.mapping.level_2] + "  \n" + d.data[layer.mapping.x_var] + "  \n" + format(d.value);
      });
      syncOrdinalLegendData(chart, layer);
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".root").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/DonutRenderer.js
  var DonutRenderer = class {
    static type = "donut";
    static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
    static scaleHints = null;
    static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      var m = chart.margin;
      var transitionSpeed = chart.options.transition.speed;
      var radius = Math.min(chart.width - (m.right + m.left), chart.height - (m.top + m.bottom)) / 2;
      var xVar = layer.mapping.x_var;
      var yVar = layer.mapping.y_var;
      if (isColorSchemeActive(chart)) {
        chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
        chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      } else {
        chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(layer.data.map(function(d) {
          return d[xVar];
        }));
      }
      var hidden = chart.runtime._hiddenOrdinalSegments || [];
      var data = layer.data.filter(function(d) {
        return hidden.indexOf(d[xVar]) === -1;
      });
      var pie = d3.pie().sort(null).value(function(d) {
        return d[yVar];
      });
      var arc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.4);
      var outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
      var path = chart.chart.selectAll(".donut").data(pie(data), function(d) {
        return d.data[xVar];
      });
      path.exit().transition().duration(transitionSpeed).ease(d3.easeQuad).attrTween("d", function(a) {
        var end = { startAngle: a.endAngle, endAngle: a.endAngle };
        var i = d3.interpolate(a, end);
        return function(t) {
          return arc(i(t));
        };
      }).remove();
      var newPath = path.enter().append("path").attr("class", "donut").attr("fill", function(d) {
        return chart.colorDiscrete(d.data[xVar]);
      }).attr("d", arc).each(function(d) {
        this._current = d;
      });
      path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeQuad).attr("fill", function(d) {
        return chart.colorDiscrete(d.data[xVar]);
      }).attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(1);
        return function(t) {
          return arc(i(t));
        };
      });
      function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
      }
      var textLabel = chart.chart.selectAll(".inner-text").data(pie(data), function(d) {
        return d.data[xVar];
      });
      textLabel.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newText = textLabel.enter().append("text").attr("class", "inner-text").style("font-size", "12px").style("opacity", 0).attr("dy", ".35em").text(function(d) {
        return d.data[xVar];
      });
      textLabel.merge(newText).transition().duration(transitionSpeed).ease(d3.easeQuad).text(function(d) {
        return d.data[xVar];
      }).style("opacity", function(d) {
        return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0;
      }).attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return "translate(" + pos + ")";
        };
      }).styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });
      var polyline = chart.chart.selectAll("polyline").data(pie(data), function(d) {
        return d.data[xVar];
      });
      polyline.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newPolyline = polyline.enter().append("polyline").style("fill", "none").style("stroke-width", "1px").style("opacity", 0).style("stroke", "gray");
      polyline.merge(newPolyline).transition().duration(transitionSpeed).ease(d3.easeQuad).style("opacity", function(d) {
        return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0;
      }).attrTween("points", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });
      syncOrdinalLegendData(chart, layer);
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".donut, .inner-text, polyline").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/GaugeRenderer.js
  var GaugeRenderer = class {
    static type = "gauge";
    static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
    static scaleHints = null;
    static dataContract = { value: { required: true, numeric: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var tau = Math.PI;
      var radius = Math.max(Math.min(chart.width, getChartHeight(chart)) / 2, 30);
      var barWidth = 30;
      var firstDatum = Array.isArray(layer.data) && layer.data.length > 0 ? layer.data[0] : {};
      var valueKey = layer.mapping.value;
      var value = typeof valueKey === "string" ? +firstDatum[valueKey] : +valueKey;
      if (!Number.isFinite(value)) {
        value = 0;
      }
      value = Math.max(0, Math.min(1, value));
      var data = [value, 1 - value];
      var arc = d3.arc().innerRadius(radius - barWidth).outerRadius(radius).cornerRadius(10);
      var pie = d3.pie().sort(null).value(function(d) {
        return d;
      }).startAngle(tau * -0.5).endAngle(tau * 0.5);
      var percentFormat = d3.format(".1%");
      var pathBackground = chart.chart.selectAll(".myIO-gauge-background").data(pie([1]));
      pathBackground.exit().remove();
      var newPathBackground = pathBackground.enter().append("path").attr("class", "myIO-gauge-background").attr("fill", "gray").transition().duration(transitionSpeed).ease(d3.easeBack).attr("d", arc).each(function() {
        this._current = 0;
      });
      pathBackground.transition().duration(transitionSpeed).ease(d3.easeBack).duration(transitionSpeed).attr("fill", "gray").attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
          return arc(i(t));
        };
      });
      var path = chart.chart.selectAll(".myIO-gauge-value").data(pie(data));
      path.exit().remove();
      var newPath = path.enter().append("path").attr("class", "myIO-gauge-value").attr("fill", function(d, i) {
        return [layer.color, "transparent"][i];
      }).transition().duration(transitionSpeed).ease(d3.easeBack).attr("d", arc).each(function() {
        this._current = 0;
      });
      path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeBack).duration(transitionSpeed).attr("fill", function(d, i) {
        return [layer.color, "transparent"][i];
      }).attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
          return arc(i(t));
        };
      });
      chart.chart.selectAll(".gauge-text").data([data[0]]).join("text").attr("class", "gauge-text").text(function(d) {
        return percentFormat(d);
      }).attr("text-anchor", "middle").attr("font-size", 20).attr("dy", "-0.45em");
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".myIO-gauge-background, .myIO-gauge-value, .gauge-text").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/HeatmapRenderer.js
  var HeatmapRenderer = class {
    static type = "heatmap";
    static traits = { hasAxes: true, referenceLines: false, legendType: "continuous", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "band", yScaleType: "band", yExtentFields: ["value"], domainMerge: "union" };
    static dataContract = { x_var: { required: true }, y_var: { required: true }, value: { required: true, numeric: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var xVar = layer.mapping.x_var;
      var yVar = layer.mapping.y_var;
      var valueVar = layer.mapping.value;
      var values = layer.data.map(function(d) {
        return +d[valueVar];
      });
      var extent = d3.extent(values.filter(function(v) {
        return Number.isFinite(v);
      }));
      if (!extent || extent[0] === void 0 || extent[1] === void 0) {
        extent = [0, 1];
      }
      chart.derived.colorContinuous = d3.scaleSequential(d3.interpolateBlues).domain(extent);
      chart.colorContinuous = chart.derived.colorContinuous;
      var cells = chart.chart.selectAll("." + tagName("heatmap", chart.element.id, layer.label)).data(layer.data);
      cells.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var cellWidth = chart.xScale.bandwidth ? chart.xScale.bandwidth() : 0;
      var cellHeight = chart.yScale.bandwidth ? chart.yScale.bandwidth() : 0;
      var newCells = cells.enter().append("rect").attr("class", tagName("heatmap", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0);
      cells.merge(newCells).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x", function(d) {
        return chart.xScale(d[xVar]);
      }).attr("y", function(d) {
        return chart.yScale(d[yVar]);
      }).attr("width", cellWidth).attr("height", cellHeight).attr("fill", function(d) {
        return chart.colorContinuous(+d[valueVar]);
      }).style("opacity", 1);
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("heatmap", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return {
        title: layer.mapping.x_var + ": " + d[layer.mapping.x_var] + ", " + layer.mapping.y_var + ": " + d[layer.mapping.y_var],
        body: layer.mapping.value + ": " + d[layer.mapping.value],
        color: chart.colorContinuous ? chart.colorContinuous(+d[layer.mapping.value]) : layer.color,
        label: layer.label,
        value: d[layer.mapping.value],
        raw: d
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("heatmap", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/CandlestickRenderer.js
  var CandlestickRenderer = class {
    static type = "candlestick";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["open", "high", "low", "close"], domainMerge: "union" };
    static dataContract = {
      x_var: { required: true, numeric: true },
      open: { required: true, numeric: true },
      high: { required: true, numeric: true },
      low: { required: true, numeric: true },
      close: { required: true, numeric: true }
    };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var xVar = layer.mapping.x_var;
      var openVar = layer.mapping.open;
      var highVar = layer.mapping.high;
      var lowVar = layer.mapping.low;
      var closeVar = layer.mapping.close;
      var width = Math.max(4, Math.min(12, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)));
      var self2 = this;
      var candle = chart.chart.selectAll("." + tagName("candlestick", chart.element.id, layer.label)).data(layer.data);
      candle.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var enter = candle.enter().append("g").attr("class", tagName("candlestick", chart.element.id, layer.label));
      enter.append("line").attr("class", "wick").attr("stroke", "#666").attr("stroke-width", 1.5);
      enter.append("rect").attr("class", "body").attr("stroke-width", 0.5);
      candle.merge(enter).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).each(function(d) {
        var group = d3.select(this);
        var x = chart.xScale(d[xVar]);
        var open = +d[openVar];
        var high = +d[highVar];
        var low = +d[lowVar];
        var close = +d[closeVar];
        var up = close >= open;
        var fill = up ? "#4CAF50" : "#F44336";
        var bodyY = chart.yScale(Math.max(open, close));
        var bodyHeight = Math.abs(chart.yScale(open) - chart.yScale(close));
        group.select("line.wick").attr("x1", x).attr("x2", x).attr("y1", chart.yScale(low)).attr("y2", chart.yScale(high));
        group.select("rect.body").attr("x", x - width / 2).attr("y", bodyY).attr("width", width).attr("height", Math.max(bodyHeight, 1)).attr("fill", fill).attr("stroke", fill);
      });
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("candlestick", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return {
        title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
        body: "O: " + d[layer.mapping.open] + ", H: " + d[layer.mapping.high] + ", L: " + d[layer.mapping.low] + ", C: " + d[layer.mapping.close],
        color: d[layer.mapping.close] >= d[layer.mapping.open] ? "#4CAF50" : "#F44336",
        label: layer.label,
        value: d[layer.mapping.close],
        raw: d
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("candlestick", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/WaterfallRenderer.js
  var WaterfallRenderer = class {
    static type = "waterfall";
    static traits = { hasAxes: true, referenceLines: true, legendType: "none", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "band", yScaleType: "linear", yExtentFields: ["_base_y", "_cumulative_y"], domainMerge: "union" };
    static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var xVar = layer.mapping.x_var;
      var deltaVar = layer.mapping.y_var;
      var bandwidth = chart.xScale.bandwidth ? chart.xScale.bandwidth() : 0;
      var hasColorArray = Array.isArray(layer.color);
      var bars = chart.chart.selectAll("." + tagName("waterfall", chart.element.id, layer.label)).data(layer.data);
      bars.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newBars = bars.enter().append("rect").attr("class", tagName("waterfall", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0);
      bars.merge(newBars).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).attr("x", function(d) {
        return chart.xScale(d[xVar]);
      }).attr("width", bandwidth).attr("y", function(d) {
        return chart.yScale(Math.max(+d._base_y, +d._cumulative_y));
      }).attr("height", function(d) {
        return Math.abs(chart.yScale(+d._base_y) - chart.yScale(+d._cumulative_y));
      }).attr("fill", function(d, i) {
        if (hasColorArray) {
          return layer.color[i % layer.color.length];
        }
        if (d._is_total) {
          return "#888";
        }
        return +d._cumulative_y >= +d._base_y ? "#4CAF50" : "#F44336";
      });
      var connectors = layer.data.slice(0, Math.max(layer.data.length - 1, 0));
      var connectorLines = chart.chart.selectAll("." + tagName("waterfall-connector", chart.element.id, layer.label)).data(connectors);
      connectorLines.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newConnectors = connectorLines.enter().append("line").attr("class", tagName("waterfall-connector", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("stroke", "#666").style("stroke-width", 1.5).style("opacity", 0);
      connectorLines.merge(newConnectors).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).attr("x1", function(d, i) {
        return chart.xScale(layer.data[i][xVar]) + bandwidth;
      }).attr("x2", function(d, i) {
        return chart.xScale(layer.data[i + 1][xVar]);
      }).attr("y1", function(d) {
        return chart.yScale(+d._cumulative_y);
      }).attr("y2", function(d) {
        return chart.yScale(+d._cumulative_y);
      });
    }
    formatTooltip(chart, d, layer) {
      return {
        title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
        body: "Delta: " + d[layer.mapping.y_var] + ", Total: " + d._cumulative_y,
        color: d._is_total ? "#888" : +d._cumulative_y >= +d._base_y ? "#4CAF50" : "#F44336",
        label: layer.label,
        value: d._cumulative_y,
        raw: d
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("waterfall", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("waterfall-connector", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/SankeyRenderer.js
  var SankeyRenderer = class {
    static type = "sankey";
    static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = null;
    static dataContract = { source: { required: true }, target: { required: true }, value: { required: true, numeric: true } };
    render(chart, layer) {
      var m = chart.margin;
      var width = chart.width - (m.left + m.right);
      var height = getChartHeight(chart) - (m.top + m.bottom);
      var nodeWidth = 18;
      var sankey = d3.sankey().nodeId(function(d) {
        return d.name;
      }).nodeWidth(nodeWidth).nodePadding(12).extent([[0, 0], [width, height]]);
      var nodesByName = /* @__PURE__ */ new Map();
      var links = layer.data.map(function(d) {
        var source = d[layer.mapping.source];
        var target = d[layer.mapping.target];
        if (!nodesByName.has(source)) {
          nodesByName.set(source, { name: source });
        }
        if (!nodesByName.has(target)) {
          nodesByName.set(target, { name: target });
        }
        return {
          source,
          target,
          value: +d[layer.mapping.value]
        };
      });
      var graph = sankey({
        nodes: Array.from(nodesByName.values()),
        links
      });
      chart.derived.colorDiscrete = d3.scaleOrdinal().domain(graph.nodes.map(function(d) {
        return d.name;
      })).range(layer.color || d3.schemeTableau10);
      chart.colorDiscrete = chart.derived.colorDiscrete;
      var link = chart.chart.selectAll("." + tagName("sankey", chart.element.id, layer.label)).data(graph.links);
      link.exit().transition().duration(chart.options.transition.speed).style("opacity", 0).remove();
      var newLink = link.enter().append("path").attr("class", tagName("sankey", chart.element.id, layer.label)).attr("fill", "none").attr("stroke", "#888").attr("stroke-opacity", 0.4).attr("clip-path", "url(#" + chart.element.id + "clip)");
      link.merge(newLink).transition().ease(d3.easeQuad).duration(chart.options.transition.speed).attr("d", d3.sankeyLinkHorizontal()).attr("stroke-width", function(d) {
        return Math.max(1, d.width);
      }).attr("stroke", function(d) {
        return chart.colorDiscrete(d.source.name);
      });
      var node = chart.chart.selectAll("." + tagName("sankey-node", chart.element.id, layer.label)).data(graph.nodes);
      node.exit().transition().duration(chart.options.transition.speed).style("opacity", 0).remove();
      var newNode = node.enter().append("rect").attr("class", tagName("sankey-node", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("fill", function(d) {
        return chart.colorDiscrete(d.name);
      });
      node.merge(newNode).transition().ease(d3.easeQuad).duration(chart.options.transition.speed).attr("x", function(d) {
        return d.x0;
      }).attr("y", function(d) {
        return d.y0;
      }).attr("width", function(d) {
        return d.x1 - d.x0;
      }).attr("height", function(d) {
        return Math.max(1, d.y1 - d.y0);
      }).attr("fill", function(d) {
        return chart.colorDiscrete(d.name);
      });
    }
    formatTooltip(chart, d, layer) {
      if (d && Object.prototype.hasOwnProperty.call(d, "source")) {
        return {
          title: d.source.name + " -> " + d.target.name,
          body: "Value: " + d.value,
          color: chart.colorDiscrete ? chart.colorDiscrete(d.source.name) : layer.color,
          label: layer.label,
          value: d.value,
          raw: d
        };
      }
      return {
        title: d.name,
        body: "Value: " + d.value,
        color: chart.colorDiscrete ? chart.colorDiscrete(d.name) : layer.color,
        label: layer.label,
        value: d.value,
        raw: d
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("sankey", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("sankey-node", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/registry.js
  var rendererRegistry = /* @__PURE__ */ new Map();
  function registerRenderer(type, RendererClass) {
    if (rendererRegistry.has(type)) {
      throw new Error("Renderer already registered for type: " + type);
    }
    var traits = RendererClass && RendererClass.constructor ? RendererClass.constructor.traits : null;
    var requiredTraitKeys = ["hasAxes", "referenceLines", "legendType", "binning", "rolloverStyle"];
    if (!traits) {
      throw new Error("Renderer missing static traits: " + type);
    }
    requiredTraitKeys.forEach(function(key) {
      if (!(key in traits)) {
        throw new Error("Renderer trait missing '" + key + "': " + type);
      }
    });
    rendererRegistry.set(type, RendererClass);
  }
  function getRenderer(type) {
    if (!rendererRegistry.has(type)) {
      throw new Error("Unknown renderer type: " + type);
    }
    return rendererRegistry.get(type);
  }
  function getRendererForLayer(layer) {
    return getRenderer(layer.type);
  }
  function registerBuiltInRenderers() {
    if (!rendererRegistry.has(LineRenderer.type)) {
      registerRenderer(LineRenderer.type, new LineRenderer());
    }
    if (!rendererRegistry.has(PointRenderer.type)) {
      registerRenderer(PointRenderer.type, new PointRenderer());
    }
    if (!rendererRegistry.has(AreaRenderer.type)) {
      registerRenderer(AreaRenderer.type, new AreaRenderer());
    }
    if (!rendererRegistry.has(BarRenderer.type)) {
      registerRenderer(BarRenderer.type, new BarRenderer());
    }
    if (!rendererRegistry.has(GroupedBarRenderer.type)) {
      registerRenderer(GroupedBarRenderer.type, new GroupedBarRenderer());
    }
    if (!rendererRegistry.has(HistogramRenderer.type)) {
      registerRenderer(HistogramRenderer.type, new HistogramRenderer());
    }
    if (!rendererRegistry.has(HexbinRenderer.type)) {
      registerRenderer(HexbinRenderer.type, new HexbinRenderer());
    }
    if (!rendererRegistry.has(TreemapRenderer.type)) {
      registerRenderer(TreemapRenderer.type, new TreemapRenderer());
    }
    if (!rendererRegistry.has(DonutRenderer.type)) {
      registerRenderer(DonutRenderer.type, new DonutRenderer());
    }
    if (!rendererRegistry.has(GaugeRenderer.type)) {
      registerRenderer(GaugeRenderer.type, new GaugeRenderer());
    }
    if (!rendererRegistry.has(HeatmapRenderer.type)) {
      registerRenderer(HeatmapRenderer.type, new HeatmapRenderer());
    }
    if (!rendererRegistry.has(CandlestickRenderer.type)) {
      registerRenderer(CandlestickRenderer.type, new CandlestickRenderer());
    }
    if (!rendererRegistry.has(WaterfallRenderer.type)) {
      registerRenderer(WaterfallRenderer.type, new WaterfallRenderer());
    }
    if (!rendererRegistry.has(SankeyRenderer.type)) {
      registerRenderer(SankeyRenderer.type, new SankeyRenderer());
    }
    return rendererRegistry;
  }
  function listRenderers() {
    return Array.from(rendererRegistry.values());
  }

  // inst/htmlwidgets/myIO/src/interactions/drag.js
  function bindPointDrag(chart, layer) {
    var color = resolveColor(chart, layer.label, layer.color);
    var drag = d3.drag().on("start", function() {
      d3.select(this).raise().classed("active", true).style("cursor", "grabbing");
    }).on("drag", function(event, d) {
      d[layer.mapping.x_var] = chart.xScale.invert(event.x);
      d[layer.mapping.y_var] = chart.yScale.invert(event.y);
      d3.select(this).attr("cx", chart.xScale(d[layer.mapping.x_var])).attr("cy", chart.yScale(d[layer.mapping.y_var]));
    }).on("end", function() {
      d3.select(this).classed("active", false).style("cursor", "grab");
      chart.updateRegression(color, layer.label);
    });
    chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).style("cursor", "grab").call(drag);
  }

  // inst/htmlwidgets/myIO/src/tooltip.js
  function sanitize(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
  function initializeTooltip(chart) {
    chart.dom.tooltip = d3.select(chart.dom.element).append("div").attr("class", "toolTip").attr("role", "status").attr("aria-live", "polite").attr("aria-hidden", "true");
    chart.dom.tooltipTitle = chart.dom.tooltip.append("div").attr("class", "toolTipTitle");
    chart.dom.tooltipBody = chart.dom.tooltip.append("div").attr("class", "toolTipBody");
    chart.runtime.tooltipHideTimer = null;
    chart.captureLegacyAliases();
  }
  function removeHoverOverlay(chart) {
    d3.select(chart.dom.element).select(".toolTipBox").remove();
    d3.select(chart.dom.element).select(".toolLine").remove();
    d3.select(chart.dom.element).select(".toolPointLayer").remove();
    chart.runtime.toolTipBox = null;
    chart.runtime.toolLine = null;
    chart.runtime.toolPointLayer = null;
    chart.syncLegacyAliases();
  }
  function createHoverOverlay(chart, onMove, onEnd) {
    removeHoverOverlay(chart);
    chart.runtime.toolLine = chart.dom.chartArea.append("line").attr("class", "toolLine");
    chart.runtime.toolPointLayer = chart.dom.chartArea.append("g").attr("class", "toolPointLayer");
    chart.runtime.toolTipBox = chart.dom.svg.append("rect").attr("class", "toolTipBox").attr("opacity", 0).attr("width", chart.width - (chart.margin.left + chart.margin.right)).attr("height", chart.height - (chart.margin.top + chart.margin.bottom)).attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")").on("mouseover", function(event) {
      onMove(event);
    }).on("mousemove", function(event) {
      onMove(event);
    }).on("mouseout", function() {
      if (typeof onEnd === "function") {
        onEnd();
      }
    }).on("touchstart", function(event) {
      event.preventDefault();
      onMove(event);
    }).on("touchmove", function(event) {
      event.preventDefault();
      onMove(event);
    }).on("touchend", function() {
      if (typeof onEnd === "function") {
        onEnd();
      }
    });
    chart.syncLegacyAliases();
  }
  function showChartTooltip(chart, config) {
    if (!chart.dom.tooltip) {
      return;
    }
    clearTimeout(chart.runtime.tooltipHideTimer);
    const pointer = config.pointer || [0, 0];
    const title = config.title || {};
    const items = config.items || [];
    const accentColor = items.length === 1 && items[0].color ? items[0].color : null;
    chart.dom.tooltipTitle.style("border-left-color", accentColor || null).html("<span>" + sanitize(formatTooltipText(title)) + "</span>");
    const rows = chart.dom.tooltipBody.selectAll(".toolTipItem").data(items);
    rows.exit().remove();
    const rowsEnter = rows.enter().append("div").attr("class", "toolTipItem");
    rowsEnter.append("span").attr("class", "dot");
    rowsEnter.append("span").attr("class", "toolTipLabel");
    rowsEnter.append("span").attr("class", "toolTipValue");
    rowsEnter.merge(rows).select(".dot").style("background-color", function(d) {
      return d.color || "transparent";
    });
    rowsEnter.merge(rows).select(".toolTipLabel").text(function(d) {
      return d.label || "";
    });
    rowsEnter.merge(rows).select(".toolTipValue").text(function(d) {
      return formatTooltipText(d);
    });
    chart.dom.tooltip.style("display", "inline-block").style("opacity", 1).attr("aria-hidden", "false");
    positionTooltip(chart, pointer);
  }
  function hideChartTooltip(chart) {
    if (!chart.dom.tooltip) {
      return;
    }
    clearTimeout(chart.runtime.tooltipHideTimer);
    chart.runtime.tooltipHideTimer = window.setTimeout(function() {
      chart.dom.tooltip.style("display", "none").style("opacity", 0).attr("aria-hidden", "true");
    }, 300);
  }
  function formatTooltipText(config) {
    if (config == null) {
      return "";
    }
    if (typeof config === "string") {
      return config;
    }
    const format = typeof config.format === "function" ? config.format : function(value) {
      return value;
    };
    const text = config.text != null ? config.text : config.value;
    return text == null ? "" : format(text);
  }
  function positionTooltip(chart, pointer) {
    const containerRect = chart.dom.element.getBoundingClientRect();
    const tooltipNode = chart.dom.tooltip.node();
    chart.dom.tooltip.style("left", pointer[0] + 12 + "px").style("top", pointer[1] + 12 + "px");
    const tooltipRect = tooltipNode.getBoundingClientRect();
    let left = pointer[0] + 12;
    let top = pointer[1] + 12;
    if (left + tooltipRect.width > containerRect.width) {
      left = Math.max(8, pointer[0] - tooltipRect.width - 12);
    }
    if (top + tooltipRect.height > containerRect.height) {
      top = Math.max(8, pointer[1] - tooltipRect.height - 12);
    }
    chart.dom.tooltip.style("left", left + "px").style("top", top + "px");
  }

  // inst/htmlwidgets/myIO/src/interactions/rollover.js
  var HOVER_TRANSITION_MS = 300;
  function bindRollover(chart, layers) {
    var lys = layers || chart.currentLayers || [];
    var that = chart;
    var exclusions = ["text", "yearMon"];
    var xFormat = exclusions.indexOf(chart.options.xAxisFormat) > -1 ? function(x) {
      return x;
    } : d3.format(chart.options.xAxisFormat ? chart.options.xAxisFormat : "d");
    var yFormat = d3.format(chart.options.yAxisFormat ? chart.options.yAxisFormat : "d");
    var currentFormatY = chart.newScaleY ? d3.format(chart.newScaleY) : yFormat;
    removeHoverOverlay(chart);
    lys.forEach(function(layer) {
      if (["bar", "point", "hexbin", "histogram"].indexOf(layer.type) > -1) {
        bindElementLayer(layer);
      }
    });
    if (lys.some(function(layer) {
      return layer.type === "groupedBar";
    })) {
      chart.chart.selectAll(".tag-grouped-bar-g rect").on("mouseout", clearGroupedBar).on("mouseover", showGroupedBar).on("mousemove", showGroupedBar).on("touchstart", function(event) {
        event.preventDefault();
        showGroupedBar.call(this, event);
      }).on("touchmove", function(event) {
        event.preventDefault();
        showGroupedBar.call(this, event);
      }).on("touchend", clearGroupedBar);
    }
    if (lys.length > 0 && lys.every(function(layer) {
      return ["line", "area"].indexOf(layer.type) > -1;
    })) {
      createHoverOverlay(chart, showOverlayTooltip, clearOverlayTooltip);
    }
    if (lys.some(function(layer) {
      return layer.type === "donut";
    })) {
      bindOrdinalHover(".donut", "donut", function(d, layer) {
        return {
          title: { text: layer.mapping.x_var + ": " + d.data[layer.mapping.x_var] },
          items: [{
            color: chart.colorDiscrete(d.index),
            label: layer.mapping.y_var,
            value: d.data[layer.mapping.y_var]
          }]
        };
      });
    }
    if (lys.some(function(layer) {
      return layer.type === "treemap";
    })) {
      chart.chart.selectAll(".root").on("mouseout", clearTreemap).on("mouseover", showTreemap).on("mousemove", showTreemap).on("touchstart", function(event) {
        event.preventDefault();
        showTreemap.call(this, event);
      }).on("touchmove", function(event) {
        event.preventDefault();
        showTreemap.call(this, event);
      }).on("touchend", clearTreemap);
    }
    function bindElementLayer(layer) {
      var renderer = getRendererForLayer(layer);
      var selector = renderer.getHoverSelector ? renderer.getHoverSelector(chart, layer) : "." + tagName(layer.type, chart.element.id, layer.label);
      chart.chart.selectAll(selector).on("mouseout", function() {
        clearElementHover.call(this, layer);
      }).on("mouseover", function(event) {
        showElementHover.call(this, event, layer);
      }).on("mousemove", function(event) {
        showElementHover.call(this, event, layer);
      }).on("touchstart", function(event) {
        event.preventDefault();
        showElementHover.call(this, event, layer);
      }).on("touchmove", function(event) {
        event.preventDefault();
        showElementHover.call(this, event, layer);
      }).on("touchend", function() {
        clearElementHover.call(this, layer);
      });
    }
    function showElementHover(event, layer) {
      var data = d3.select(this).data()[0];
      var renderer = getRendererForLayer(layer);
      var tooltip = buildTooltip(layer, renderer, data, this);
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data));
      }
      applyElementHighlight(this, layer, data);
      showChartTooltip(that, {
        pointer: getContainerPointer(event),
        title: tooltip.title,
        items: tooltip.items
      });
    }
    function clearElementHover(layer) {
      removeElementHighlight(this, layer);
      hideChartTooltip(that);
    }
    function buildTooltip(layer, renderer, data, node) {
      if (layer.type === "hexbin") {
        var pointFormat = d3.format(",.2f");
        return {
          title: { text: "x: " + pointFormat(that.xScale.invert(data.x)) + ", y: " + pointFormat(that.yScale.invert(data.y)) },
          items: [{ color: d3.select(node).attr("fill"), label: "Count", value: data.length }]
        };
      }
      if (layer.type === "histogram") {
        return {
          title: { text: "Bin: " + data.x0 + " to " + data.x1 },
          items: [{ color: d3.select(node).attr("fill"), label: "Count", value: data.length }]
        };
      }
      var titleText = layer.mapping.x_var + ": " + xFormat(data[layer.mapping.x_var]);
      var yKey = that.newY ? that.newY : layer.mapping.y_var;
      var label = layer.type === "point" || layer.type === "bar" ? layer.mapping.y_var : layer.label;
      var color = resolveColor(that, layer.label, layer.color);
      if (renderer && typeof renderer.formatTooltip === "function") {
        var formatted = renderer.formatTooltip(that, data, layer);
        titleText = formatted.title || titleText;
        label = formatted.label || label;
        color = formatted.color || color;
      }
      return {
        title: { text: titleText },
        items: [{ color, label, value: currentFormatY(data[yKey]) }]
      };
    }
    function applyElementHighlight(node, layer) {
      var selection = d3.select(node);
      var color = layer.type === "hexbin" ? "#333" : selection.attr("fill") || selection.style("fill") || resolveColor(that, layer.label, layer.color);
      if (layer.type === "hexbin") {
        selection.style("stroke", color).style("stroke-width", "2px");
        return;
      }
      selection.interrupt().style("stroke", color).style("stroke-width", "2px").style("stroke-opacity", 0.8);
      if (layer.type === "point") {
        selection.attr("r", Math.max(+selection.attr("r") || 0, 6));
      }
    }
    function removeElementHighlight(node, layer) {
      var selection = d3.select(node);
      selection.interrupt().transition().duration(HOVER_TRANSITION_MS).style("stroke-width", "0px").style("stroke", "transparent").style("stroke-opacity", null);
      if (layer.type === "point") {
        selection.transition().duration(HOVER_TRANSITION_MS).attr("r", pointRadius(that));
      }
    }
    function showGroupedBar(event) {
      var data = d3.select(this).data()[0];
      var thisLayer = lys[data.idx];
      var color = resolveColor(that, thisLayer.label, thisLayer.color);
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data.data.values));
      }
      d3.select(this).interrupt().style("stroke", color).style("stroke-width", "2px").style("stroke-opacity", 0.8);
      showChartTooltip(that, {
        pointer: getContainerPointer(event),
        title: { text: thisLayer.mapping.x_var + ": " + xFormat(data.data[0]) },
        items: [{ color, label: thisLayer.mapping.y_var, value: currentFormatY(data[1] - data[0]) }]
      });
    }
    function clearGroupedBar() {
      d3.select(this).interrupt().transition().duration(HOVER_TRANSITION_MS).style("stroke-width", "0px").style("stroke", "transparent").style("stroke-opacity", null);
      hideChartTooltip(that);
    }
    function showOverlayTooltip(event) {
      var mouse = d3.pointer(event, this);
      var xPos = that.xScale.invert(mouse[0]);
      var tipText = [];
      var bisect = d3.bisector(function(d) {
        return +d[0];
      }).left;
      lys.forEach(function(layer) {
        var values = layer.data;
        var xVar = layer.mapping.x_var;
        var yVar = that.newY ? that.newY : layer.mapping.y_var;
        var layerIndex = values.map(function(value) {
          return value[xVar];
        });
        var idx = bisect(layerIndex, xPos);
        var d0 = values[idx - 1];
        var d1 = values[idx];
        var v = !d0 ? d1 : !d1 ? d0 : xPos - d0[xVar] > d1[xVar] - xPos ? d1 : d0;
        if (!v) {
          return;
        }
        tipText.push({
          color: layer.color,
          label: layer.label,
          xVar,
          yVar,
          value: v
        });
      });
      if (tipText.length === 0) {
        clearOverlayTooltip();
        return;
      }
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(tipText.map(function(d) {
          return d.value;
        })));
      }
      var xValue = tipText[0].value[tipText[0].xVar];
      that.toolLine.style("stroke", "var(--chart-ref-line-color)").style("stroke-width", "1px").style("stroke-dasharray", "4,4").attr("x1", that.xScale(xValue)).attr("x2", that.xScale(xValue)).attr("y1", 0).attr("y2", that.height - (that.margin.top + that.margin.bottom));
      var points = that.toolPointLayer.selectAll("circle").data(tipText);
      points.exit().remove();
      points.enter().append("circle").attr("r", 4).merge(points).attr("cx", function(d) {
        return that.xScale(d.value[d.xVar]);
      }).attr("cy", function(d) {
        return that.yScale(d.value[d.yVar]);
      }).attr("fill", "#ffffff").attr("stroke", function(d) {
        return d.color;
      }).attr("stroke-width", 2);
      showChartTooltip(that, {
        pointer: getContainerPointer(event),
        title: { text: tipText[0].xVar + ": " + xFormat(xValue) },
        items: tipText.map(function(d) {
          return { color: d.color, label: d.label, value: currentFormatY(d.value[d.yVar]) };
        })
      });
    }
    function clearOverlayTooltip() {
      if (that.toolLine) {
        that.toolLine.style("stroke", "none");
      }
      if (that.toolPointLayer) {
        that.toolPointLayer.selectAll("*").remove();
      }
      hideChartTooltip(that);
    }
    function bindOrdinalHover(selector, layerType, tooltipBuilder) {
      var layer = lys.filter(function(candidate) {
        return candidate.type === layerType;
      })[0];
      chart.chart.selectAll(selector).on("mouseout", function() {
        chart.chart.selectAll(selector).transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
        hideChartTooltip(that);
      }).on("mouseover", function(event, d) {
        chart.chart.selectAll(selector).style("opacity", 0.4);
        d3.select(this).style("opacity", 0.85);
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      }).on("mousemove", function(event, d) {
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      }).on("touchstart", function(event, d) {
        event.preventDefault();
        chart.chart.selectAll(selector).style("opacity", 0.4);
        d3.select(this).style("opacity", 0.85);
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      }).on("touchend", function() {
        chart.chart.selectAll(selector).transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
        hideChartTooltip(that);
      });
    }
    function showTreemap(event, d) {
      var layer = lys.filter(function(candidate) {
        return candidate.type === "treemap";
      })[0];
      var colorNode = d;
      while (colorNode.depth > 1) {
        colorNode = colorNode.parent;
      }
      chart.chart.selectAll(".root").style("opacity", 0.4);
      d3.select(this).style("opacity", 0.85);
      showChartTooltip(that, {
        pointer: getContainerPointer(event),
        title: { text: layer.mapping.level_1 + ": " + d.data[layer.mapping.level_1] },
        items: [{
          color: chart.colorDiscrete(colorNode.data.id),
          label: d.data[layer.mapping.level_2],
          value: d.value
        }]
      });
    }
    function clearTreemap() {
      chart.chart.selectAll(".root").transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
      hideChartTooltip(that);
    }
    function getContainerPointer(event) {
      return d3.pointer(event, that.dom.element);
    }
  }

  // inst/htmlwidgets/myIO/src/derive/scales.js
  var X_DOMAIN_BUFFER = 0.05;
  var Y_DOMAIN_BUFFER = 0.15;
  function createBins(chart, lys) {
    var m = chart.margin;
    var chartHeight = getChartHeight(chart);
    var x_extents = [];
    lys.forEach(function(d) {
      var x2 = d3.extent(d.data, function(e) {
        return +e[d.mapping.value];
      });
      x_extents.push(x2);
    });
    var x_min = d3.min(x_extents, function(d) {
      return d[0];
    });
    var x_max = d3.max(x_extents, function(d) {
      return d[1];
    });
    var x = d3.scaleLinear().domain([x_min, x_max]).nice().range([0, chart.width - (m.left + m.right)]);
    lys.forEach(function(d) {
      var values = d.data.map(function(e) {
        return e[d.mapping.value];
      });
      d.bins = d3.bin().domain(x.domain()).thresholds(x.ticks(d.mapping.bins))(values);
      d.max_value = d3.max(d.bins, function(bin) {
        return bin.length;
      });
    });
    chart.derived.xScale = x;
    chart.derived.yScale = d3.scaleLinear().domain([0, d3.max(lys, function(d) {
      return d.max_value;
    })]).nice().range([chartHeight - (m.top + m.bottom), 0]);
  }
  function processScales(chart, lys, semantics) {
    var m = chart.margin;
    var x_extents = [];
    var y_extents = [];
    var x_bands = [];
    var y_bands = [];
    var scaleSemantics = semantics || {};
    var yExtentFields = scaleSemantics.yExtentFields || ["y_var"];
    lys.forEach(function(d) {
      var x_var = d.mapping.x_var;
      var x = d3.extent(d.data, function(e) {
        return +e[x_var];
      });
      var yValues = [];
      yExtentFields.forEach(function(field) {
        var dataField = d.mapping[field] || field;
        var values = d.data.map(function(e) {
          return +e[dataField];
        });
        yValues = yValues.concat(values);
      });
      var yExtent2 = d3.extent(yValues.length > 0 ? yValues : [0], function(e) {
        return e;
      });
      x_extents.push(x);
      y_extents.push([
        yExtent2[0],
        yExtent2[1]
      ]);
      x_bands.push(d.data.map(function(e) {
        return e[x_var];
      }));
      y_bands.push(d.data.map(function(e) {
        var dataField = d.mapping.y_var || "y_var";
        return e[dataField];
      }));
    });
    var x_min = d3.min(x_extents, function(d) {
      return d[0];
    });
    var x_max = d3.max(x_extents, function(d) {
      return d[1];
    });
    var x_check1 = d3.min(x_extents, function(d) {
      return d[0];
    });
    var x_check2 = d3.max(x_extents, function(d) {
      return d[1];
    });
    chart.derived.xCheck = x_check1 === 0 && x_check2 === 0;
    if (x_min == x_max) {
      x_min = x_min - 1;
      x_max = x_max + 1;
    }
    var x_buffer = Math.max(Math.abs(x_max - x_min) * X_DOMAIN_BUFFER, 0.5);
    var xExtent = [
      chart.config.scales.xlim.min ? +chart.config.scales.xlim.min : x_min - x_buffer,
      chart.config.scales.xlim.max ? +chart.config.scales.xlim.max : x_max + x_buffer
    ];
    chart.derived.xBanded = [].concat.apply([], x_bands).map(function(d) {
      try {
        return Array.isArray(d) ? d[0] : d;
      } catch (err) {
        return void 0;
      }
    }).filter(onlyUnique);
    var y_min = d3.min(y_extents, function(d) {
      return d[0];
    });
    var y_max = d3.max(y_extents, function(d) {
      return d[1];
    });
    if (y_min == y_max) {
      y_min = y_min - 1;
      y_max = y_max + 1;
    }
    var y_buffer = Math.abs(y_max - y_min) * Y_DOMAIN_BUFFER;
    var yExtent = [
      chart.config.scales.ylim.min ? +chart.config.scales.ylim.min : y_min - y_buffer,
      chart.config.scales.ylim.max ? +chart.config.scales.ylim.max : y_max + y_buffer
    ];
    chart.derived.yBanded = [].concat.apply([], y_bands).map(function(d) {
      try {
        return Array.isArray(d) ? d[0] : d;
      } catch (err) {
        return void 0;
      }
    }).filter(onlyUnique);
    var chartHeight = getChartHeight(chart);
    switch (scaleSemantics.xScaleType) {
      case "band":
        chart.derived.xScale = d3.scaleBand().range([0, chart.width - (m.left + m.right)]).domain(chart.config.scales.flipAxis === true ? chart.derived.yBanded : chart.derived.xBanded);
        break;
      default:
        chart.derived.xScale = d3.scaleLinear().range([0, chart.width - (m.right + m.left)]).domain(chart.config.scales.flipAxis === true ? yExtent : xExtent);
    }
    switch (scaleSemantics.yScaleType) {
      case "band":
        chart.derived.yScale = d3.scaleBand().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.config.scales.flipAxis === true ? chart.derived.xBanded : chart.derived.yBanded);
        break;
      default:
        chart.derived.yScale = d3.scaleLinear().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.config.scales.flipAxis === true ? xExtent : yExtent);
    }
    if (chart.config.scales.colorScheme && chart.config.scales.colorScheme.enabled) {
      chart.derived.colorDiscrete = d3.scaleOrdinal().range(chart.config.scales.colorScheme.colors).domain(chart.config.scales.colorScheme.domain);
      chart.derived.colorContinuous = d3.scaleLinear().range(chart.config.scales.colorScheme.colors).domain(chart.config.scales.colorScheme.domain);
    }
    chart.syncLegacyAliases();
  }
  function onlyUnique(value, index, self2) {
    return self2.indexOf(value) === index;
  }

  // inst/htmlwidgets/myIO/src/derive/scale-semantics.js
  var DEFAULT_SCALE_HINTS = {
    xScaleType: "linear",
    yScaleType: "linear",
    yExtentFields: ["y_var"],
    domainMerge: "union"
  };
  function normalizeHints(hints) {
    if (!hints) {
      return null;
    }
    return Object.assign({}, DEFAULT_SCALE_HINTS, hints);
  }
  function getScaleHintsForLayer(layer) {
    if (layer && layer.scaleHints) {
      return normalizeHints(layer.scaleHints);
    }
    try {
      var renderer = getRendererForLayer(layer);
      return normalizeHints(renderer.constructor.scaleHints);
    } catch (err) {
      return null;
    }
  }
  function resolveFallbackScaleType(chart, axis) {
    var categoricalScale = chart && chart.config && chart.config.scales && chart.config.scales.categoricalScale;
    if (categoricalScale && categoricalScale[axis + "Axis"] === true) {
      return "band";
    }
    return "linear";
  }
  function resolveScaleSemantics(chart, layers) {
    var flipAxis = !!(chart && chart.config && chart.config.scales && chart.config.scales.flipAxis);
    var xTypes = /* @__PURE__ */ new Set();
    var yTypes = /* @__PURE__ */ new Set();
    var yExtentFields = /* @__PURE__ */ new Set();
    var domainMerge = "union";
    (layers || []).forEach(function(layer) {
      var hints = getScaleHintsForLayer(layer);
      var xType = hints ? hints.xScaleType : resolveFallbackScaleType(chart, "x");
      var yType = hints ? hints.yScaleType : resolveFallbackScaleType(chart, "y");
      var resolvedX = flipAxis ? yType : xType;
      var resolvedY = flipAxis ? xType : yType;
      xTypes.add(resolvedX);
      yTypes.add(resolvedY);
      var fields = hints && Array.isArray(hints.yExtentFields) ? hints.yExtentFields : DEFAULT_SCALE_HINTS.yExtentFields;
      fields.forEach(function(field) {
        yExtentFields.add(field);
      });
      if (hints && hints.domainMerge === "independent") {
        domainMerge = "independent";
      }
    });
    if (xTypes.size > 1 || yTypes.size > 1) {
      throw new Error(
        "Mismatched scaleTypes across layers: x=" + Array.from(xTypes).join(", ") + ", y=" + Array.from(yTypes).join(", ") + "."
      );
    }
    return {
      xScaleType: xTypes.size > 0 ? Array.from(xTypes)[0] : resolveFallbackScaleType(chart, "x"),
      yScaleType: yTypes.size > 0 ? Array.from(yTypes)[0] : resolveFallbackScaleType(chart, "y"),
      yExtentFields: Array.from(yExtentFields).length > 0 ? Array.from(yExtentFields) : DEFAULT_SCALE_HINTS.yExtentFields,
      domainMerge
    };
  }

  // inst/htmlwidgets/myIO/src/derive/chart-render.js
  function deriveChartRender(chart) {
    var layers = chart.derived.currentLayers || [];
    var traits = layers.map(function(layer) {
      return getRendererForLayer(layer).constructor.traits;
    });
    var primaryType = layers[0] ? layers[0].type : null;
    var legendTypes = Array.from(new Set(traits.map(function(trait) {
      return trait.legendType;
    })));
    return {
      type: primaryType,
      axesChart: traits.every(function(trait) {
        return trait.hasAxes;
      }),
      histogram: traits.length > 0 && traits.every(function(trait) {
        return trait.binning;
      }),
      continuousLegend: legendTypes.length === 1 && legendTypes[0] === "continuous",
      ordinalLegend: legendTypes.length === 1 && legendTypes[0] === "ordinal",
      referenceLines: traits.some(function(trait) {
        return trait.referenceLines;
      })
    };
  }
  function applyDerivedScales(chart, renderState) {
    if (!renderState.axesChart) {
      return;
    }
    if (renderState.histogram) {
      createBins(chart, chart.derived.currentLayers);
    } else {
      var semantics = resolveScaleSemantics(chart, chart.derived.currentLayers);
      processScales(chart, chart.derived.currentLayers, semantics);
    }
  }

  // inst/htmlwidgets/myIO/src/derive/validate.js
  var COMPAT_GROUP = {
    line: "axes-continuous",
    point: "axes-continuous",
    area: "axes-continuous",
    bar: "axes-categorical",
    groupedBar: "axes-categorical",
    histogram: "axes-binned",
    heatmap: "axes-matrix",
    candlestick: "axes-continuous",
    waterfall: "axes-categorical",
    sankey: "standalone-flow",
    hexbin: "axes-hex",
    treemap: "standalone-treemap",
    donut: "standalone-donut",
    gauge: "standalone-gauge"
  };
  var CROSS_GROUP_ALLOWED = /* @__PURE__ */ new Set([
    "axes-continuous:axes-categorical",
    "axes-categorical:axes-continuous",
    "axes-binned:axes-continuous",
    "axes-continuous:axes-binned"
  ]);
  function validateComposition(layers) {
    if (layers.length <= 1) return { valid: true, errors: [] };
    const errors = [];
    const groups = layers.map(function(layer) {
      return COMPAT_GROUP[layer.type] || "unknown";
    });
    const standalone = groups.filter(function(group) {
      return group.startsWith("standalone");
    });
    if (standalone.length > 0 && layers.length > 1) {
      errors.push("Cannot mix standalone chart types with other layers.");
    }
    if (standalone.length > 1) {
      errors.push("Standalone chart types must be used alone.");
    }
    const uniqueGroups = Array.from(new Set(groups));
    if (uniqueGroups.length > 1) {
      uniqueGroups.forEach(function(group, index) {
        uniqueGroups.slice(index + 1).forEach(function(other) {
          if (!CROSS_GROUP_ALLOWED.has(group + ":" + other)) {
            errors.push("Cannot mix layer groups '" + group + "' and '" + other + "'.");
          }
        });
      });
    }
    return { valid: errors.length === 0, errors };
  }
  function validateAgainstContract(layer, contract) {
    const errors = [];
    const warnings = [];
    if (!contract) {
      return { errors, warnings };
    }
    Object.entries(contract).forEach(function(entry) {
      const field = entry[0];
      const rules = entry[1];
      const mapped = layer.mapping ? layer.mapping[field] : null;
      if (rules.required && !mapped) {
        errors.push("Layer '" + layer.label + "' is missing required mapping '" + field + "'.");
        return;
      }
      if (!mapped) {
        return;
      }
      const values = Array.isArray(layer.data) ? typeof mapped === "string" ? layer.data.map(function(row) {
        return row[mapped];
      }) : layer.data.map(function() {
        return mapped;
      }) : [];
      if (rules.numeric) {
        const invalid = values.find(function(value) {
          return Number.isNaN(+value);
        });
        if (invalid !== void 0) {
          errors.push("Layer '" + layer.label + "' field '" + mapped + "' must be numeric.");
        }
      }
      if (rules.positive) {
        const invalid = values.find(function(value) {
          return +value <= 0;
        });
        if (invalid !== void 0) {
          errors.push("Layer '" + layer.label + "' field '" + mapped + "' must be positive.");
        }
      }
      if (rules.sorted) {
        for (let i = 1; i < values.length; i += 1) {
          if (+values[i] < +values[i - 1]) {
            warnings.push("Layer '" + layer.label + "' field '" + mapped + "' is not sorted.");
            break;
          }
        }
      }
      if (rules.unique && new Set(values).size !== values.length) {
        warnings.push("Layer '" + layer.label + "' field '" + mapped + "' contains duplicate values.");
      }
      const nullCount = values.filter(function(value) {
        return value === null || value === void 0 || Number.isNaN(value);
      }).length;
      if (nullCount > 0) {
        warnings.push("Layer '" + layer.label + "' field '" + mapped + "' contains " + nullCount + " null/NaN values.");
      }
    });
    return { errors, warnings };
  }
  function validateLayers(chart) {
    const layers = chart.derived.currentLayers || chart.config.layers || [];
    const composition = validateComposition(layers);
    if (!composition.valid) {
      composition.errors.forEach(function(message) {
        chart.emit("error", { message });
      });
      return [];
    }
    return layers.filter(function(layer) {
      const renderer = getRendererForLayer(layer);
      const contract = renderer.constructor.dataContract;
      const result = validateAgainstContract(layer, contract);
      result.warnings.forEach(function(message) {
        console.warn(message);
      });
      if (result.errors.length > 0) {
        result.errors.forEach(function(message) {
          chart.emit("error", { message, layer });
        });
        return false;
      }
      return true;
    });
  }

  // inst/htmlwidgets/myIO/src/layout/reference-lines.js
  function syncReferenceLines(chart, state) {
    if (!state.referenceLines) {
      return;
    }
    updateReferenceLines(chart);
  }
  function updateReferenceLines(chart) {
    var m = chart.margin;
    var transitionSpeed = chart.options.transition.speed;
    var xRef = [chart.options.referenceLine.x];
    var yRef = [chart.options.referenceLine.y];
    if (chart.options.referenceLine.x) {
      var xRefLine = chart.plot.selectAll(".ref-x-line").data(xRef);
      xRefLine.exit().transition().duration(100).style("opacity", 0).attr("y2", chart.height - (m.top + m.bottom)).remove();
      var newxRef = xRefLine.enter().append("line").attr("class", "ref-x-line").attr("fill", "none").style("stroke", "gray").style("stroke-width", 3).attr("x1", function(d) {
        return chart.xScale(d);
      }).attr("x2", function(d) {
        return chart.xScale(d);
      }).attr("y1", chart.height - (m.top + m.bottom)).attr("y2", chart.height - (m.top + m.bottom)).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("y2", 0);
      xRefLine.merge(newxRef).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x1", function(d) {
        return chart.xScale(d);
      }).attr("x2", function(d) {
        return chart.xScale(d);
      }).attr("y1", chart.height - (m.top + m.bottom)).attr("y2", 0);
    } else {
      chart.plot.selectAll(".ref-x-line").remove();
    }
    if (chart.options.referenceLine.y) {
      var yRefLine = chart.plot.selectAll(".ref-y-line").data(yRef);
      yRefLine.exit().transition().duration(100).attr("y2", chart.width - (m.left + m.right)).style("opacity", 0).remove();
      var newyRef = yRefLine.enter().append("line").attr("class", "ref-y-line").attr("fill", "none").style("stroke", "gray").style("stroke-width", 3).attr("x1", 0).attr("x2", 0).attr("y1", function(d) {
        return chart.yScale(d);
      }).attr("y2", function(d) {
        return chart.yScale(d);
      }).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x2", chart.width - (m.left + m.right));
      yRefLine.merge(newyRef).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x1", 0).attr("x2", chart.width - (m.left + m.right)).attr("y1", function(d) {
        return chart.yScale(d);
      }).attr("y2", function(d) {
        return chart.yScale(d);
      });
    } else {
      chart.plot.selectAll(".ref-y-line").remove();
    }
  }

  // inst/htmlwidgets/myIO/src/utils/math.js
  function linearRegression(data, yVar, xVar) {
    const x = data.map(function(d) {
      return d[xVar];
    });
    const y = data.map(function(d) {
      return d[yVar];
    });
    const lr = {};
    const n = y.length;
    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_xx = 0;
    let sum_yy = 0;
    for (let i = 0; i < y.length; i++) {
      sum_x += x[i];
      sum_y += y[i];
      sum_xy += x[i] * y[i];
      sum_xx += x[i] * x[i];
      sum_yy += y[i] * y[i];
    }
    lr.slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    lr.intercept = (sum_y - lr.slope * sum_x) / n;
    lr.r2 = Math.pow(
      (n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),
      2
    );
    lr.fn = function(xValue) {
      return this.slope * xValue + this.intercept;
    };
    return lr;
  }

  // inst/htmlwidgets/myIO/src/Chart.js
  var MIN_CHART_WIDTH = 280;
  var RESIZE_DEBOUNCE_MS = 100;
  var EventEmitter = {
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
      this._listeners[event] = handler ? this._listeners[event].filter(function(candidate) {
        return candidate !== handler;
      }) : [];
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
  var myIOchart = class {
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
        activeYFormat: null,
        tooltipHideTimer: null
      };
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.config.transitions.speed = 0;
      }
      this.runtime.width = this.runtime.totalWidth;
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
      this.options = this.config ? {
        margin: this.config.layout.margin,
        suppressLegend: this.config.layout.suppressLegend,
        suppressAxis: this.config.layout.suppressAxis,
        xlim: this.config.scales.xlim,
        ylim: this.config.scales.ylim,
        categoricalScale: this.config.scales.categoricalScale,
        flipAxis: this.config.scales.flipAxis,
        colorScheme: this.config.scales.colorScheme ? this.config.scales.colorScheme.enabled ? [this.config.scales.colorScheme.colors, this.config.scales.colorScheme.domain, "on"] : [this.config.scales.colorScheme.colors, this.config.scales.colorScheme.domain, "off"] : null,
        xAxisFormat: this.config.axes.xAxisFormat,
        yAxisFormat: this.config.axes.yAxisFormat,
        toolTipFormat: this.config.axes.toolTipFormat,
        xAxisLabel: this.config.axes.xAxisLabel,
        yAxisLabel: this.config.axes.yAxisLabel,
        dragPoints: this.config.interactions.dragPoints,
        toggleY: this.config.interactions.toggleY && this.config.interactions.toggleY.variable ? [this.config.interactions.toggleY.variable, this.config.interactions.toggleY.format] : null,
        toolTipOptions: this.config.interactions.toolTipOptions,
        transition: this.config.transitions,
        referenceLine: this.config.referenceLines
      } : null;
      this.margin = this.config ? this.config.layout.margin : null;
      this.width = this.runtime ? this.runtime.width : null;
      this.height = this.runtime ? this.runtime.height : null;
      this.totalWidth = this.runtime ? this.runtime.totalWidth : null;
      this.layout = this.runtime ? this.runtime.layout : null;
      this.newY = this.runtime ? this.runtime.activeY : null;
      this.newScaleY = this.runtime ? this.runtime.activeYFormat : null;
      this.toolLine = this.runtime ? this.runtime.toolLine : null;
      this.toolTipBox = this.runtime ? this.runtime.toolTipBox : null;
      this.toolPointLayer = this.runtime ? this.runtime.toolPointLayer : null;
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
      this.runtime.toolPointLayer = this.toolPointLayer || this.runtime.toolPointLayer;
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
      if (this.config.theme) {
        var el = this.dom.element;
        Object.keys(this.config.theme).forEach(function(key) {
          if (this.config.theme[key] != null) {
            el.style.setProperty("--" + key, this.config.theme[key]);
          }
        }, this);
      }
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
          var activeLabels = this.derived.currentLayers.map(function(l) {
            return l.label;
          });
          var allLabels = this.config.layers.map(function(l) {
            return l.label;
          });
          var chartArea = this.dom.chartArea;
          allLabels.forEach(function(label) {
            if (activeLabels.indexOf(label) === -1) {
              var safeName = String(label).replace(/\s+/g, "");
              chartArea.selectAll("[class*='tag-'][class*='-" + safeName + "']").remove();
            }
          });
        }
        this.emit("beforeRender", { options });
        this.derived.currentLayers = validateLayers(this);
        this.syncLegacyAliases();
        this.clearEmptyState();
        if (!isCurrent()) {
          return;
        }
        if (this.derived.currentLayers.length === 0) {
          this.renderEmptyState();
          return;
        }
        const state = deriveChartRender(this);
        applyDerivedScales(this, state);
        this.syncLegacyAliases();
        if (!isCurrent()) {
          return;
        }
        addFAB(this);
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
    clearEmptyState() {
      if (this.dom && this.dom.svg) {
        this.dom.svg.selectAll(".myIO-empty-state").remove();
      }
      if (this.dom && this.dom.element) {
        d3.select(this.dom.element).select(".myIO-fab").style("display", null);
      }
    }
    renderEmptyState() {
      if (this.dom.chartArea) {
        this.dom.chartArea.selectAll("*").interrupt().remove();
      }
      if (this.dom.plot) {
        this.dom.plot.selectAll(".x-axis, .y-axis").interrupt().remove();
        this.dom.plot.selectAll(".ref-x-line, .ref-y-line").remove();
      }
      if (this.dom.legendArea) {
        this.dom.legendArea.selectAll("*").remove();
      }
      removeHoverOverlay(this);
      hideChartTooltip(this);
      if (this.runtime && this.runtime._sheetOpen) {
        closePanel(this, { returnFocus: false });
      }
      if (this.dom.element) {
        d3.select(this.dom.element).select(".myIO-fab").style("display", "none");
      }
      if (this.dom.svg) {
        this.dom.svg.selectAll(".myIO-empty-state").remove();
        this.dom.svg.append("text").attr("class", "myIO-empty-state").attr("x", this.runtime.totalWidth / 2).attr("y", this.runtime.height / 2).text("No data to display");
      }
    }
    addButtons() {
      addFAB(this);
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
      var bandwidth = (this.runtime.width - (this.config.layout.margin.right + this.config.layout.margin.left)) / (data[0].length + 1) / colors.length;
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
          this.dom.clipPath = this.dom.chartArea.append("defs").append("svg:clipPath").attr("id", this.dom.element.id + "clip").append("svg:rect").attr("x", 0).attr("y", 0).attr("width", this.runtime.width - (this.config.layout.margin.left + this.config.layout.margin.right)).attr("height", chartHeight - (this.config.layout.margin.top + this.config.layout.margin.bottom));
          this.dom.chartArea.attr("clip-path", "url(#" + this.dom.element.id + "clip)");
          this.syncLegacyAliases();
      }
    }
    routeLayers(layers) {
      var that = this;
      this.derived.layerIndex = this.config.layers.map(function(d) {
        return d.label;
      });
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
    updateOrdinalColorLegend(ly) {
      syncOrdinalLegendData(this, ly);
    }
    updateRegression(color, label) {
      const pointLayer = (this.config.layers || []).find(function(layer) {
        return layer.label === label && layer.type === "point";
      });
      if (!pointLayer) {
        return;
      }
      (this.config.layers || []).forEach(function(layer) {
        if (layer.type !== "line" || layer.transform !== "lm") {
          return;
        }
        if (!layer.mapping || !pointLayer.mapping) {
          return;
        }
        if (layer.mapping.x_var !== pointLayer.mapping.x_var || layer.mapping.y_var !== pointLayer.mapping.y_var) {
          return;
        }
        const regression = linearRegression(pointLayer.data, pointLayer.mapping.y_var, pointLayer.mapping.x_var);
        const derivedData = pointLayer.data.map(function(row) {
          return {
            ...row,
            [layer.mapping.y_var]: regression.fn(row[layer.mapping.x_var])
          };
        }).sort(function(a, b) {
          return a[layer.mapping.x_var] - b[layer.mapping.x_var];
        });
        layer.data = derivedData;
        getRenderer("line").render(this, { ...layer, color: color || layer.color }, this.config.layers);
      }, this);
    }
    updateChart(newConfig) {
      const oldLabels = this.derived.layerIndex || [];
      this.config = newConfig;
      this.derived.currentLayers = this.config.layers;
      this.syncLegacyAliases();
      const newLabels = this.config.layers.map(function(layer) {
        return layer.label;
      });
      const removed = oldLabels.filter(function(label) {
        return !newLabels.includes(label);
      });
      this.removeLayers(removed);
      this.renderCurrentLayers();
    }
    resize(width, height) {
      const wasSheetOpen = this.runtime && this.runtime._sheetOpen === true;
      if (wasSheetOpen) {
        closePanel(this, { returnFocus: false });
      }
      this.runtime.totalWidth = Math.max(width, MIN_CHART_WIDTH);
      this.runtime.width = this.runtime.totalWidth;
      this.runtime.height = height;
      this.syncLegacyAliases();
      clearTimeout(this.runtime.resizeTimer);
      this.runtime.resizeTimer = setTimeout(() => {
        updateScaffoldLayout(this);
        this.captureLegacyAliases();
        this.renderCurrentLayers();
        if (wasSheetOpen && this.derived && this.derived.currentLayers && this.derived.currentLayers.length > 0) {
          openPanel(this);
        }
        this.emit("resize", { width: this.runtime.width, height: this.runtime.height });
      }, RESIZE_DEBOUNCE_MS);
    }
    destroy() {
      this.emit("destroy", {});
      clearTimeout(this.runtime && this.runtime.resizeTimer);
      clearTimeout(this.runtime && this.runtime.tooltipHideTimer);
      if (this.runtime && this.runtime._sheetOpen) {
        closePanel(this, { returnFocus: false });
      }
      clearTimeout(this.runtime && this.runtime._sheetCloseTimer);
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
        d3.select(this.dom.element).selectAll(".buttonDiv, .myIO-fab, .myIO-panel, .myIO-sheet-backdrop").remove();
      }
      removeHoverOverlay(this);
      this._listeners = {};
      this.config = null;
      this.derived = null;
      this.dom = null;
      this.runtime = null;
    }
  };

  // inst/htmlwidgets/myIO/src/index.js
  registerBuiltInRenderers();
  window.myIOchart = myIOchart;
})();
/*!
 * Vendored FileSaver.js for phase-1 modularization.
 * Source: http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js
 */
