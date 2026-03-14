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

  // inst/htmlwidgets/myIO/src/renderers/RegressionRenderer.js
  var RegressionRenderer = class {
    static type = "regression";
    static traits = { hasAxes: true, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
    static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };
    renderFromPoints(chart, color, label) {
      var that = chart;
      var transitionSpeed = chart.options.transition.speed / 2;
      var valueLine = d3.line().x(function(d) {
        return chart.xScale(d.x_var);
      }).y(function(d) {
        return chart.yScale(d.y_est);
      });
      var points = [];
      chart.chart.selectAll("." + tagName("point", chart.element.id, label)).each(function() {
        var x = that.xScale.invert(this.getAttribute("cx"));
        var y = that.yScale.invert(this.getAttribute("cy"));
        points.push({
          x_var: x,
          y_var: y
        });
      });
      var regression = linearRegression(points, "y_var", "x_var");
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIOregression-" + label.replace(/\s+/g, ""), regression);
      }
      points.forEach(function(d) {
        d.y_est = regression.fn(d.x_var);
      });
      var finalPoints = points.sort(function(a, b) {
        return a.x_var - b.x_var;
      }).filter(function(d, i) {
        return i === 0 || i === points.length - 1;
      });
      var linePath = chart.chart.selectAll("." + tagName("regression-line", chart.element.id, label)).data([finalPoints]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("class", tagName("regression-line", chart.element.id, label)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", "none").style("stroke", color).style("stroke-width", 3).style("opacity", 0);
      linePath.merge(newLinePath).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).style("stroke", color).attr("d", valueLine);
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("regression-line", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/AreaRenderer.js
  var AreaRenderer = class {
    static type = "area";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
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
    bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();
    var newBars = bars.enter().append("rect").attr("class", tagName("bar", chart.element.id, key)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return resolveColor(chart, d[layer.mapping.x_var], layer.color);
    }).attr("x", function(d) {
      return defineVerticalScale(chart, d, layer, bandwidth, barSize, chart.options.categoricalScale.xAxis);
    }).attr("y", chart.yScale(0)).attr("width", barSize * bandwidth - 2).attr("height", chart.yScale(0));
    bars.merge(newBars).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x", function(d) {
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
    bars.exit().transition().duration(transitionSpeed).attr("width", 0).remove();
    var newBars = bars.enter().append("rect").attr("class", tagName("bar", chart.element.id, key)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return resolveColor(chart, d[layer.mapping.x_var], layer.color);
    }).attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    }).attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    }).attr("height", barSize * bandwidth - 2).attr("width", 0);
    bars.merge(newBars).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    }).attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    }).attr("height", barSize * bandwidth - 2).attr("width", function(d) {
      return Math.abs(chart.xScale(d[layer.mapping.y_var]) - chart.xScale(0));
    });
  }

  // inst/htmlwidgets/myIO/src/layout/scaffold.js
  function getChartHeight(chart) {
    if (chart.options.suppressLegend == false) {
      return responsiveValue(chart, chart.height, chart.height * 0.8);
    }
    return chart.height;
  }
  function initializeScaffold(chart) {
    d3.select(chart.element).selectAll(".myIO-svg, .buttonDiv, .toolTip").remove();
    chart.svg = d3.select(chart.element).append("svg").attr("class", "myIO-svg").attr("id", "myIO-svg" + chart.element.id).attr("width", chart.totalWidth).attr("height", chart.height).attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height);
    applyPlotTransform(chart);
    chart.chart = chart.plot.append("g").attr("class", "myIO-chart-area");
    if (chart.options.suppressLegend == false) {
      chart.legendTranslate = isMobile(chart) ? "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")" : "translate(" + chart.width + ",0)";
      chart.legendArea = chart.svg.append("g").attr("class", "myIO-legend-area").attr("transform", chart.legendTranslate).style("height", responsiveValue(chart, chart.height, chart.height * 0.2)).style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left));
    }
  }
  function updateScaffoldLayout(chart) {
    chart.svg.attr("width", chart.totalWidth).attr("height", chart.height).attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height);
    applyPlotTransform(chart);
    if (chart.plotLayers[0] && chart.plotLayers[0].type !== "gauge" && chart.plotLayers[0].type !== "donut" && chart.clipPath) {
      chart.clipPath.attr("x", 0).attr("y", 0).attr("width", chart.width - (chart.margin.left + chart.margin.right)).attr("height", getChartHeight(chart) - (chart.margin.top + chart.margin.bottom));
    }
    if (chart.options.suppressLegend == false && chart.legendArea) {
      chart.legendTranslate = isMobile(chart) ? "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")" : "translate(" + chart.width + ",0)";
      chart.legendArea.attr("transform", chart.legendTranslate).style("height", responsiveValue(chart, chart.height, chart.height * 0.2)).style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left));
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
    barsNew.exit().transition().duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();
    barsNew.enter().append("rect").attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
      return chart.xScale(+d.data[0]) + bandwidth * d.idx;
    }).attr("y", chart.yScale(0)).attr("height", 0).attr("width", bandwidth).transition().duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("y", function(d) {
      return chart.yScale(d[1] - d[0]);
    }).attr("height", function(d) {
      return chart.yScale(0) - chart.yScale(d[1] - d[0]);
    });
    barsNew.merge(barsNew).transition().duration(transitionSpeed).delay(function(d) {
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
    barsNew.exit().transition().duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();
    barsNew.enter().append("rect").attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
      return chart.xScale(+d.data[0]);
    }).attr("y", function(d) {
      return yScale(d[1]);
    }).attr("height", 0).attr("width", bandwidth * data.length).transition().duration(transitionSpeed).delay(function(d) {
      return d.idx * 20;
    }).attr("y", function(d) {
      return yScale(d[1]);
    }).attr("height", function(d) {
      return yScale(d[0]) - yScale(d[1]);
    }).transition().attr("x", function(d) {
      return chart.xScale(+d.data[0]);
    }).attr("width", bandwidth * data.length);
    barsNew.merge(barsNew).transition().duration(transitionSpeed).delay(function(d) {
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
      return d[x_var[0]][0];
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

  // inst/htmlwidgets/myIO/src/renderers/TreemapRenderer.js
  var TreemapRenderer = class {
    static type = "treemap";
    static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
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
      cell.merge(newCell).transition().duration(750).attr("transform", function(d) {
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
      chart.updateOrdinalColorLegend(layer);
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".root").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/DonutRenderer.js
  var DonutRenderer = class {
    static type = "donut";
    static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
    static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };
    render(chart, layer) {
      var m = chart.margin;
      var transitionSpeed = chart.options.transition.speed;
      var radius = Math.min(chart.width - (m.right + m.left), chart.height - (m.top + m.bottom)) / 2;
      var pie = d3.pie().sort(null).value(function(d) {
        return d[layer.mapping.y_var];
      });
      var arc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.4);
      var outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
      var data = layer.data;
      if (isColorSchemeActive(chart)) {
        chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
        chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      } else {
        chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(layer.data.map(function(d) {
          return d[layer.mapping.x_var];
        }));
      }
      var path = chart.chart.selectAll(".donut").data(pie(data));
      path.exit().remove();
      var newPath = path.enter().append("path").attr("class", "donut").attr("fill", function(d, i) {
        return chart.colorDiscrete(i);
      }).attr("d", arc).each(function() {
        this._current = 0;
      });
      path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeQuad).attr("fill", function(d, i) {
        return chart.colorDiscrete(i);
      }).attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
          return arc(i(t));
        };
      });
      var textLabel = chart.chart.selectAll("text").data(pie(data));
      var newText = textLabel.enter().append("text").attr("class", "inner-text").style("font-size", "12px").style("opacity", 0).attr("dy", ".35em").text(function(d) {
        return d.data[layer.mapping.x_var];
      });
      function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
      }
      textLabel.merge(newText).transition().duration(transitionSpeed).ease(d3.easeQuad).text(function(d) {
        return d.data[layer.mapping.x_var];
      }).style("opacity", function(d) {
        return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0;
      }).attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return "translate(" + pos + ")";
        };
      }).styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });
      textLabel.exit().remove();
      var polyline = chart.chart.selectAll("polyline").data(pie(data));
      var newPolyline = polyline.enter().append("polyline").style("fill", "none").style("stroke-width", "1px").style("opacity", 0).style("stroke", "gray");
      polyline.merge(newPolyline).transition().duration(transitionSpeed).ease(d3.easeQuad).style("opacity", function(d) {
        return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0;
      }).attrTween("points", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });
      polyline.exit().remove();
      chart.updateOrdinalColorLegend(layer);
    }
    remove(chart) {
      chart.dom.chartArea.selectAll(".donut, text, polyline").transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/GaugeRenderer.js
  var GaugeRenderer = class {
    static type = "gauge";
    static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
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

  // inst/htmlwidgets/myIO/src/renderers/StatLineRenderer.js
  var StatLineRenderer = class extends LineRenderer {
    static type = "stat_line";
    static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
    static dataContract = { x_var: { required: true, numeric: true, sorted: true }, y_var: { required: true, numeric: true } };
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
    if (!rendererRegistry.has(StatLineRenderer.type)) {
      registerRenderer(StatLineRenderer.type, new StatLineRenderer());
    }
    if (!rendererRegistry.has(PointRenderer.type)) {
      registerRenderer(PointRenderer.type, new PointRenderer());
    }
    if (!rendererRegistry.has(RegressionRenderer.type)) {
      registerRenderer(RegressionRenderer.type, new RegressionRenderer());
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
    return rendererRegistry;
  }
  function listRenderers() {
    return Array.from(rendererRegistry.values());
  }

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
      var selectorTextArr = [];
      selectorTextArr.push("#" + parentElement.id);
      for (var c = 0; c < parentElement.classList.length; c++) {
        if (!contains("." + parentElement.classList[c], selectorTextArr)) {
          selectorTextArr.push("." + parentElement.classList[c]);
        }
      }
      var nodes = parentElement.getElementsByTagName("*");
      for (var i = 0; i < nodes.length; i++) {
        var id = nodes[i].id;
        if (!contains("#" + id, selectorTextArr)) {
          selectorTextArr.push("#" + id);
        }
        if ("@" + id) {
          selectorTextArr.push("@" + id);
        }
        var classes = nodes[i].classList;
        for (var j = 0; j < classes.length; j++) {
          if (!contains("." + classes[j], selectorTextArr)) {
            selectorTextArr.push("." + classes[j]);
          }
        }
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
          if (contains(cssRules[r].selectorText, selectorTextArr)) {
            extractedCSSText += cssRules[r].cssText;
          }
        }
      }
      return extractedCSSText;
      function contains(str, arr) {
        return arr.indexOf(str) !== -1;
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
  function addButtons(chart, layers) {
    var buttonData = [
      {
        name: "image",
        html: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><title>PNG</title><path d="M9.5 19c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5-2.91-6.5-6.5-6.5-6.5 2.91-6.5 6.5zM30 8h-7c-0.5-2-1-4-3-4h-8c-2 0-2.5 2-3 4h-7c-1.1 0-2 0.9-2 2v18c0 1.1 0.9 2 2 2h28c1.1 0 2-0.9 2-2v-18c0-1.1-0.9-2-2-2zM16 27.875c-4.902 0-8.875-3.973-8.875-8.875s3.973-8.875 8.875-8.875c4.902 0 8.875 3.973 8.875 8.875s-3.973 8.875-8.875 8.875zM30 14h-4v-2h4v2z"></path></svg>'
      },
      {
        name: "chart",
        html: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -3 35 35"><title>Download Data</title><path d="M26 2h-20l-6 6v21c0 0.552 0.448 1 1 1h30c0.552 0 1-0.448 1-1v-21l-6-6zM16 26l-10-8h6v-6h8v6h6l-10 8zM4.828 6l2-2h18.343l2 2h-22.343z"></path></svg>'
      },
      {
        name: "percent",
        html: '<!-- Generated by IcoMoon.io --><svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="-5 -5 32 32"><title>Percent to Number</title><path d="M18.293 4.293l-14 14c-0.391 0.391-0.391 1.024 0 1.414s1.024 0.391 1.414 0l14-14c0.391-0.391 0.391-1.024 0-1.414s-1.024-0.391-1.414 0zM10 6.5c0-0.966-0.393-1.843-1.025-2.475s-1.509-1.025-2.475-1.025-1.843 0.393-2.475 1.025-1.025 1.509-1.025 2.475 0.393 1.843 1.025 2.475 1.509 1.025 2.475 1.025 1.843-0.393 2.475-1.025 1.025-1.509 1.025-2.475zM8 6.5c0 0.414-0.167 0.788-0.439 1.061s-0.647 0.439-1.061 0.439-0.788-0.167-1.061-0.439-0.439-0.647-0.439-1.061 0.167-0.788 0.439-1.061 0.647-0.439 1.061-0.439 0.788 0.167 1.061 0.439 0.439 0.647 0.439 1.061zM21 17.5c0-0.966-0.393-1.843-1.025-2.475s-1.509-1.025-2.475-1.025-1.843 0.393-2.475 1.025-1.025 1.509-1.025 2.475 0.393 1.843 1.025 2.475 1.509 1.025 2.475 1.025 1.843-0.393 2.475-1.025 1.025-1.509 1.025-2.475zM19 17.5c0 0.414-0.167 0.788-0.439 1.061s-0.647 0.439-1.061 0.439-0.788-0.167-1.061-0.439-0.439-0.647-0.439-1.061 0.167-0.788 0.439-1.061 0.647-0.439 1.061-0.439 0.788 0.167 1.061 0.439 0.439 0.647 0.439 1.061z"></path></svg>'
      },
      {
        name: "group2stack",
        html: '<!-- Generated by IcoMoon.io --><svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"><title>Grouped2Stacked</title><path d="M8 6l-4-4h-2v2l4 4zM10 0h2v4h-2zM18 10h4v2h-4zM20 4v-2h-2l-4 4 2 2zM0 10h4v2h-4zM10 18h2v4h-2zM2 18v2h2l4-4-2-2zM31.563 27.563l-19.879-19.879c-0.583-0.583-1.538-0.583-2.121 0l-1.879 1.879c-0.583 0.583-0.583 1.538 0 2.121l19.879 19.879c0.583 0.583 1.538 0.583 2.121 0l1.879-1.879c0.583-0.583 0.583-1.538 0-2.121zM15 17l-6-6 2-2 6 6-2 2z"></path></svg>'
      }
    ];
    var data2Use = chart.options.toggleY ? chart.plotLayers[0].type == "groupedBar" ? buttonData : buttonData.slice(0, 3) : buttonData.slice(0, 2);
    var buttonDiv = d3.select(chart.element).append("div").attr("class", "buttonDiv").style("opacity", 1).style("left", chart.width - (40 + 40 * data2Use.length) + "px").style("top", "0px");
    buttonDiv.selectAll(".button").data(data2Use).enter().append("div").attr("class", "button").html(function(d) {
      return d.html;
    }).on("click", function(event, d) {
      if (d.name == "image") {
        var svgString = getSVGString(chart.svg.node());
        svgString2Image(svgString, 2 * chart.width, 2 * chart.height, "png", function(dataBlob) {
          saveAs(dataBlob, chart.element.id + ".png");
        });
      } else if (d.name == "chart") {
        var csvData = [];
        chart.plotLayers.forEach(function(layer) {
          csvData.push(layer.data);
        });
        exportToCsv(chart.element.id + "_data.csv", [].concat.apply([], csvData));
      } else if (d.name == "percent") {
        if (chart.toggleY) {
          if (chart.toggleY[0] == chart.options.toggleY[0]) {
            chart.toggleY = [chart.plotLayers[0].mapping.y_var, chart.options.yAxisFormat];
          } else if (chart.toggleY[0] == chart.plotLayers[0].mapping.y_var) {
            chart.toggleY = chart.options.toggleY;
          }
        } else {
          chart.toggleY = chart.options.toggleY;
        }
        chart.toggleVarY(chart.toggleY);
      } else if (d.name == "group2stack") {
        chart.toggleGroupedLayout(layers);
      }
    });
  }

  // inst/htmlwidgets/myIO/src/interactions/drag.js
  function bindPointDrag(chart, layer) {
    var color = resolveColor(chart, layer.data[layer.mapping.group], layer.color);
    var drag = d3.drag().on("start", function() {
      d3.select(this).raise().classed("active", true);
    }).on("drag", function(event, d) {
      d[0] = chart.xScale.invert(event.x);
      d[1] = chart.yScale.invert(event.y);
      d3.select(this).attr("cx", chart.xScale(d[0])).attr("cy", chart.yScale(d[1]));
    }).on("end", function() {
      d3.select(this).classed("active", false);
      chart.updateRegression(color, layer.label);
    });
    chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).call(drag);
  }

  // inst/htmlwidgets/myIO/src/tooltip.js
  function initializeTooltip(chart) {
    chart.dom.tooltip = d3.select(chart.dom.element).append("div").attr("class", "toolTip");
    chart.dom.tooltipTitle = chart.dom.tooltip.append("div").attr("class", "toolTipTitle").style("background-color", "lightgray");
    chart.dom.tooltipBody = chart.dom.tooltip.append("div").attr("class", "toolTipBody");
    chart.captureLegacyAliases();
  }
  function removeHoverOverlay(chart) {
    d3.select(chart.element).select(".toolTipBox").remove();
    d3.select(chart.element).select(".toolLine").remove();
    chart.toolTipBox = null;
    chart.toolLine = null;
  }
  function createHoverOverlay(chart, onMove) {
    removeHoverOverlay(chart);
    chart.toolLine = chart.chart.append("line").attr("class", "toolLine");
    chart.toolTipBox = chart.svg.append("rect").attr("class", "toolTipBox").attr("opacity", 0).attr("width", chart.width - (chart.margin.left + chart.margin.right)).attr("height", chart.height - (chart.margin.top + chart.margin.bottom)).attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")").on("mouseover", function() {
      chart.tooltip.style("display", null);
      chart.toolLine.style("stroke", null);
    }).on("mouseout", function() {
      hideTooltip(chart);
      if (chart.toolLine) {
        chart.toolLine.style("stroke", "none");
      }
    }).on("mousemove", onMove);
  }
  function showTooltip(chart, left, top) {
    chart.tooltip.style("left", left + "px").style("top", top + "px").style("opacity", 1).style("display", "inline-block");
  }
  function setTooltipContent(chart, titleHtml, bodyHtml) {
    chart.toolTipTitle.html(titleHtml);
    chart.toolTipBody.html(bodyHtml);
  }
  function hideTooltip(chart, delay) {
    var transition = chart.tooltip.transition();
    if (delay) {
      transition = transition.delay(delay);
    }
    transition.style("display", "none");
  }

  // inst/htmlwidgets/myIO/src/interactions/rollover.js
  function bindRollover(chart, layers) {
    var lys = layers || chart.currentLayers;
    var that = chart;
    var horizontalBreakPoint = chart.width * 0.8;
    var verticalBreakPoint = chart.height * 0.5;
    var exclusions = ["text", "yearMon"];
    var xFormat = !(exclusions.indexOf(chart.options.xAxisFormat) in exclusions) ? d3.format(chart.options.xAxisFormat ? chart.options.xAxisFormat : "d") : function(x) {
      return x;
    };
    var yFormat = d3.format(chart.options.yAxisFormat ? chart.options.yAxisFormat : "d");
    var currentFormatY = chart.newScaleY ? d3.format(chart.newScaleY) : yFormat;
    removeHoverOverlay(chart);
    lys.forEach(function(layer) {
      if (layer.type === "bar") {
        chart.chart.selectAll("." + tagName("bar", chart.element.id, layer.label)).on("mouseout", hoverTipHide).on("mouseover", hoverTip).on("mousemove", hoverTip);
      }
      if (layer.type === "histogram") {
        chart.chart.selectAll("." + tagName("bar", chart.element.id, layer.label)).on("mouseout", hoverHistogramHide).on("mouseover", hoverHistogram).on("mousemove", hoverHistogram);
      }
      if (layer.type === "point") {
        chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).on("mouseout", hoverTipHide).on("mouseover", hoverTip).on("mousemove", hoverTip);
      }
      if (layer.type === "hexbin") {
        chart.chart.selectAll("." + tagName("hexbin", chart.element.id, layer.label)).on("mouseout", hoverHexHide).on("mouseover", hoverHex).on("mousemove", hoverHex);
      }
    });
    if (lys.some(function(layer) {
      return layer.type === "groupedBar";
    })) {
      chart.chart.selectAll(".tag-grouped-bar-g rect").on("mouseout", hoverGroupedBarHide).on("mouseover", hoverGroupedBar).on("mousemove", hoverGroupedBar);
    }
    if (lys.length > 0 && lys.every(function(layer) {
      return ["line", "stat_line", "area"].indexOf(layer.type) > -1;
    })) {
      createHoverOverlay(chart, scalePointPosition);
    }
    function hoverTip(event) {
      var data = d3.select(this).data()[0];
      var thisLayer = lys.filter(function(d) {
        var keepLayer = Object.values(data).filter(function(e) {
          return e == d.label;
        });
        return keepLayer == d.label;
      });
      var xData = xFormat(data[thisLayer[0].mapping.x_var]);
      var yData = yFormat(data[thisLayer[0].mapping.y_var]);
      var groupData = thisLayer[0].label;
      var color = resolveColor(that, groupData, thisLayer[0].color);
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data));
      }
      d3.select(this).style("stroke-width", "4px").style("stroke", color);
      showTooltip(
        that,
        d3.pointer(event, this)[0] > horizontalBreakPoint ? horizontalBreakPoint : d3.pointer(event, this)[0],
        d3.pointer(event, this)[1] > verticalBreakPoint ? verticalBreakPoint - 70 : Math.max(d3.pointer(event, this)[1] - 70, 0)
      );
      setTooltipContent(
        that,
        "<span>" + thisLayer[0].mapping.x_var + ": " + xData + "</span>",
        '<div class="dot" style="background-color:' + color + ';"></div><span><strong>' + thisLayer[0].mapping.y_var + "</strong> " + yData + "</span>"
      );
    }
    function hoverTipHide() {
      d3.select(this).transition().duration(800).style("stroke-width", "0px").style("stroke", "transparent");
      hideTooltip(that, 800);
    }
    function scalePointPosition(event) {
      var tipText = [];
      var mouse = d3.pointer(event, this);
      var indexExtent = d3.max(lys.map(function(d) {
        return d.data.length;
      }));
      var xPos = that.xScale.invert(mouse[0]);
      var bisect = d3.bisector(function(d) {
        return +d[0];
      }).left;
      lys.forEach(function(d) {
        var values = d.data;
        var x_var = d.mapping.x_var;
        var layerIndex = values.map(function(value) {
          return value[x_var];
        });
        var layerIndexLength = values.length;
        var y_var = that.newY ? that.newY : d.mapping.y_var;
        var idx = bisect(layerIndex, xPos);
        var d0 = values[idx - 1];
        var d1 = values[idx];
        var v;
        if (d0 == void 0 | d1 == void 0) {
          if (layerIndexLength < indexExtent) {
            if (xPos < d3.max(layerIndex, function(value) {
              return +value;
            }) + 0.5) {
              v = d0;
            } else {
              return;
            }
          } else {
            return;
          }
        } else {
          v = xPos - d0[x_var] > d1[x_var] - xPos ? d1 : d0;
        }
        tipText.push({
          color: d.color,
          label: d.label,
          x_var,
          y_var,
          toolTip_var: d.mapping.toolTip,
          values: v
        });
      });
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(tipText.map(function(d) {
          return d.values;
        })));
      }
      if (tipText[0] != void 0) {
        that.toolLine.style("stroke", "black").style("stroke-dasharray", "1,1").attr("x1", that.xScale(tipText[0].values[tipText[0].x_var])).attr("x2", that.xScale(tipText[0].values[tipText[0].x_var])).attr("y1", 0).attr("y2", that.height - (that.margin.top + that.margin.bottom));
        showTooltip(
          that,
          d3.pointer(event, this)[0] > horizontalBreakPoint ? horizontalBreakPoint : that.xScale(tipText[0].values[tipText[0].x_var]),
          d3.pointer(event, this)[1] > verticalBreakPoint ? verticalBreakPoint - 70 : Math.max(d3.pointer(event, this)[1] - 70, 0)
        );
        setTooltipContent(that, "<span>" + tipText[0].x_var + ": " + xFormat(tipText[0].values[tipText[0].x_var]) + "</span>", (function() {
          var y_text = [];
          tipText.forEach(function(d) {
            y_text.push('<div class="dot" style="background-color:' + d.color + ';"></div><span><strong>' + d.label + "</strong>: " + currentFormatY(d.values[d.y_var]) + "</span><br>");
          });
          return y_text.join(" ");
        })());
      }
    }
    function hoverHex() {
      var data = d3.select(this).data()[0];
      var color = d3.select(this).attr("fill");
      var xPoint = data.x;
      var yPoint = data.y;
      var pointFormat = d3.format(",.2f");
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data));
      }
      showTooltip(that, xPoint > horizontalBreakPoint ? horizontalBreakPoint : xPoint, yPoint > verticalBreakPoint ? verticalBreakPoint - 70 : Math.max(yPoint - 70, 0));
      setTooltipContent(that, "<span>x: " + pointFormat(that.xScale.invert(xPoint)) + ", y: " + pointFormat(that.yScale.invert(yPoint)) + "</span>", '<div class="dot" style="background-color:' + color + ';"></div><span><strong>Count: </strong> ' + data.length + "</span>");
    }
    function hoverHexHide() {
      hideTooltip(that, 800);
    }
    function hoverGroupedBar(event) {
      var data = d3.select(this).data()[0];
      var thisLayer = lys[data.idx];
      var xData = xFormat(data.data[0]);
      var yData = currentFormatY(data[1] - data[0]);
      var groupData = thisLayer.label;
      var color = resolveColor(that, groupData, thisLayer.color);
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data.data.values));
      }
      d3.select(this).style("opacity", 0.8);
      showTooltip(
        that,
        d3.pointer(event, this)[0] > horizontalBreakPoint ? horizontalBreakPoint : d3.pointer(event, this)[0],
        d3.pointer(event, this)[1] > verticalBreakPoint ? verticalBreakPoint - 70 : Math.max(d3.pointer(event, this)[1] - 70, 0)
      );
      setTooltipContent(that, "<span>" + thisLayer.mapping.x_var + ": " + xData + "</span>", '<div class="dot" style="background-color:' + color + ';"></div><span><strong>' + thisLayer.mapping.y_var + "</strong> " + yData + "</span>");
    }
    function hoverGroupedBarHide() {
      d3.select(this).style("opacity", null);
      hideTooltip(that, 800);
    }
    function hoverHistogram() {
      var data = d3.select(this).data()[0];
      var color = d3.select(this).attr("fill");
      var xPoint = data.x0;
      var yPoint = data.length;
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data));
      }
      showTooltip(
        that,
        that.xScale(xPoint) > horizontalBreakPoint ? horizontalBreakPoint : that.xScale(xPoint),
        that.yScale(yPoint) > verticalBreakPoint ? verticalBreakPoint - 70 : Math.max(that.yScale(yPoint) - 70, 0)
      );
      setTooltipContent(that, "<span>Bin: " + data.x0 + " to " + data.x1 + "</span>", '<div class="dot" style="background-color:' + color + ';"></div><span><strong>Count: </strong> ' + data.length + "</span>");
    }
    function hoverHistogramHide() {
      hideTooltip(that, 500);
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
  function processScales(chart, lys) {
    var m = chart.margin;
    var x_extents = [];
    var y_extents = [];
    var x_bands = [];
    var y_bands = [];
    lys.forEach(function(d) {
      var currentY = chart.newY ? chart.newY : d.mapping.y_var;
      var x_var = d.mapping.x_var;
      var y_var = currentY;
      var low_y = d.mapping.low_y;
      var high_y = d.mapping.high_y;
      var x = d3.extent(d.data, function(e) {
        return +e[x_var];
      });
      var y = d3.extent(d.data, function(e) {
        return +e[y_var];
      });
      var y1 = d3.extent(d.data, function(e) {
        return +e[low_y];
      });
      var y2 = d3.extent(d.data, function(e) {
        return +e[high_y];
      });
      x_extents.push(x);
      y_extents.push([d3.min([y[0], y1[0], y2[0]]), d3.max([y[1], y1[1], y2[1]])]);
      x_bands.push(d.data.map(function(e) {
        return e[x_var];
      }));
      y_bands.push(d.data.map(function(e) {
        return e[y_var];
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
        return d[0];
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
        return d[0];
      } catch (err) {
        return void 0;
      }
    }).filter(onlyUnique);
    var chartHeight = getChartHeight(chart);
    switch (chart.config.scales.categoricalScale.xAxis) {
      case true:
        chart.derived.xScale = d3.scaleBand().range([0, chart.width - (m.left + m.right)]).domain(chart.config.scales.flipAxis === true ? chart.derived.yBanded : chart.derived.xBanded);
        break;
      case false:
        chart.derived.xScale = d3.scaleLinear().range([0, chart.width - (m.right + m.left)]).domain(chart.config.scales.flipAxis === true ? yExtent : xExtent);
    }
    switch (chart.config.scales.categoricalScale.yAxis) {
      case true:
        chart.derived.yScale = d3.scaleBand().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.config.scales.flipAxis === true ? chart.derived.xBanded : chart.derived.yBanded);
        break;
      case false:
        chart.derived.yScale = d3.scaleLinear().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.config.scales.flipAxis === true ? xExtent : yExtent);
    }
    if (chart.config.scales.colorScheme && chart.config.scales.colorScheme.enabled) {
      chart.derived.colorDiscrete = d3.scaleOrdinal().range(chart.config.scales.colorScheme.colors).domain(chart.config.scales.colorScheme.domain);
      chart.derived.colorContinuous = d3.scaleLinear().range(chart.config.scales.colorScheme.colors).domain(chart.config.scales.colorScheme.domain);
    }
    chart.captureLegacyAliases();
  }
  function onlyUnique(value, index, self2) {
    return self2.indexOf(value) === index;
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
      processScales(chart, chart.derived.currentLayers);
    }
  }

  // inst/htmlwidgets/myIO/src/derive/validate.js
  var COMPAT_GROUP = {
    line: "axes-continuous",
    stat_line: "axes-continuous",
    point: "axes-continuous",
    area: "axes-continuous",
    bar: "axes-categorical",
    groupedBar: "axes-categorical",
    histogram: "axes-binned",
    hexbin: "axes-hex",
    regression: "axes-continuous",
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
    const layers = chart.config.layers || [];
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

  // inst/htmlwidgets/myIO/src/layout/legend.js
  function syncLegend(chart, state) {
    if (chart.options.suppressLegend == true) {
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
  function updateLegend(chart) {
    var m = chart.margin;
    var activeLayers = chart.currentLayers || [];
    if (activeLayers.length === 0) {
      d3.select(chart.element).select(".legend-box").remove();
      d3.select(chart.element).selectAll(".legendElements").remove();
      return;
    }
    d3.select(chart.element).select(".legend-box").remove();
    d3.select(chart.element).selectAll(".legendElements").remove();
    var svg = chart.legendArea;
    var labelIndex = chart.plotLayers.map(function(d) {
      return d.label;
    });
    var currentLayerIndex = activeLayers.map(function(d) {
      return d.label;
    });
    var hiddenLayers = labelIndex.filter(function(d) {
      return currentLayerIndex.indexOf(d) < 0;
    });
    var itemWidth = responsiveValue(chart, 140, 125);
    var itemHeight = responsiveValue(chart, 25, 22);
    var n = isMobile(chart) ? Math.floor(chart.totalWidth / itemWidth) : 1;
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")").style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left)).style("fill", "white").style("opacity", 0.75);
    chart.plotLayers.forEach(function(layer, i) {
      var legendElement = svg.append("g").attr("class", "legendElements").selectAll(".legendElement").data([layer.label]).enter().append("g").attr("class", "legendElement").attr("transform", function() {
        return "translate(" + i % n * itemWidth + "," + Math.floor(i / n) * itemHeight + ")";
      }).attr("text-anchor", "start").attr("font-size", responsiveValue(chart, 12, 10)).style("opacity", currentLayerIndex.indexOf(layer.label) > -1 ? 1 : 0.5).on("click", toggleLine);
      if (layer.type === "point") {
        legendElement.append("circle").attr("cx", 5).attr("cy", 6).attr("r", 5).attr("fill", layer.color).attr("stroke", layer.color);
      } else {
        legendElement.append("rect").attr("x", 5).attr("y", layer.type === "line" ? 5 : 0).attr("width", 12).attr("height", 12).attr("fill", layer.color).attr("stroke", layer.color);
      }
      legendElement.append("text").attr("x", 20).attr("y", 10.5).attr("dy", "0.35em").text(function(d) {
        return d;
      });
    });
    var filteredElements = hiddenLayers ? hiddenLayers : [];
    function toggleLine() {
      var selectedData = d3.select(this).data();
      if (!filteredElements.includes(selectedData[0])) {
        filteredElements.push(selectedData[0]);
        d3.select(this).style("opacity", 0.5);
      } else {
        filteredElements = filteredElements.filter(function(d) {
          return d != selectedData[0];
        });
        d3.select(this).style("opacity", 1);
      }
      var filteredLayers = chart.plotLayers.filter(function(d) {
        return filteredElements.indexOf(d.label) === -1;
      });
      var removedLayers = chart.plotLayers.filter(function(d) {
        return filteredElements.indexOf(d.label) > -1;
      }).map(function(d) {
        return d.label;
      });
      chart.currentLayers = filteredLayers;
      if (chart.currentLayers.length === 0) {
        chart.removeLayers(removedLayers);
        return;
      }
      chart.processScales(chart.currentLayers);
      chart.removeLayers(removedLayers);
      chart.routeLayers(chart.currentLayers);
      if (chart.currentLayers[0].type != "groupedBar") chart.updateAxes();
    }
  }
  function updateOrdinalColorLegend(chart, ly) {
    var m = chart.margin;
    d3.select(chart.element).select(".legend-box").remove();
    d3.select(chart.element).selectAll(".legendElements").remove();
    var svg = chart.legendArea;
    var itemWidth = responsiveValue(chart, 140, 125);
    var itemHeight = responsiveValue(chart, 25, 22);
    var n = isMobile(chart) ? Math.floor(chart.totalWidth / itemWidth) : 1;
    var colorKey = [];
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")").style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left)).style("fill", "white").style("opacity", 0.75);
    if (ly.type === "treemap") {
      colorKey = ly.data.children.map(function(d) {
        return d.name;
      });
    } else if (ly.type === "donut") {
      colorKey = ly.data.map(function(d) {
        return d[ly.mapping.x_var];
      });
    }
    colorKey.forEach(function(d, i) {
      var legendElement = svg.append("g").attr("class", "legendElements").selectAll(".legendElement").data([d]).enter().append("g").attr("class", "legendElement").attr("transform", function() {
        return "translate(" + i % n * itemWidth + "," + Math.floor(i / n) * itemHeight + ")";
      }).attr("text-anchor", "start").attr("font-size", responsiveValue(chart, 12, 10));
      legendElement.append("rect").attr("x", 5).attr("width", 12).attr("height", 12).attr("fill", ly.type == "treemap" ? chart.colorDiscrete("treemap." + d) : chart.colorDiscrete(d)).attr("stroke", ly.type == "treemap" ? chart.colorDiscrete("treemap." + d) : chart.colorDiscrete(d));
      legendElement.append("text").attr("x", 20).attr("y", 10.5).attr("dy", "0.35em").text(d);
    });
  }
  function updateContinuousColorLegend(chart) {
    var m = chart.margin;
    d3.select(chart.element).select(".legend-box").remove();
    d3.select(chart.element).selectAll(".legendElements").remove();
    d3.select(chart.element).select("#linear-gradient").remove();
    var svg = chart.legendArea;
    var defs = chart.chart.select("defs");
    var colorContinuous = chart.colorContinuous;
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + responsiveValue(chart, m.top, 0) + ")").style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left)).style("fill", "white").style("opacity", 0.75);
    if (!isMobile(chart)) {
      buildVerticalLegend();
    } else {
      buildHorizontalLegend();
    }
    function buildVerticalLegend() {
      const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient").attr("x1", "0%").attr("y1", "100%").attr("x2", "0%").attr("y2", "0%").attr("spreadMethod", "pad");
      linearGradient.selectAll("stop").data(colorContinuous.ticks().map(function(t, i, n) {
        return { offset: 100 * i / n.length + "%", color: colorContinuous(t) };
      })).enter().append("stop").attr("offset", function(d) {
        return d.offset;
      }).attr("stop-color", function(d) {
        return d.color;
      });
      svg.append("g").attr("class", "legendElements").attr("transform", "translate(10, 15)").append("rect").attr("transform", "translate(0, 0)").attr("width", 20).attr("height", chart.height - m.top - 10).style("fill", "url(#linear-gradient)");
      var legendScale = d3.scaleLinear().range([chart.height - m.top - m.bottom, 0]).domain([colorContinuous.domain()[0], colorContinuous.domain()[1]]);
      svg.append("g").attr("class", "legendElements legendAxis").attr("transform", "translate(30, 15)").call(d3.axisRight().scale(legendScale).ticks(5)).selectAll("text").attr("class", "legend-label");
      svg.selectAll(".domain").attr("class", "legend-line");
    }
    function buildHorizontalLegend() {
      const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");
      linearGradient.selectAll("stop").data(colorContinuous.ticks().map(function(t, i, n) {
        return { offset: 100 * i / n.length + "%", color: colorContinuous(t) };
      })).enter().append("stop").attr("offset", function(d) {
        return d.offset;
      }).attr("stop-color", function(d) {
        return d.color;
      });
      svg.append("g").attr("class", "legendElements legendBox").attr("transform", "translate(0, 20)").append("rect").attr("transform", "translate(10, 0)").attr("width", chart.width - m.right - m.left).attr("height", 20).style("fill", "url(#linear-gradient)");
      var legendScale = d3.scaleLinear().range([0, chart.width - m.right - m.left]).domain([colorContinuous.domain()[0], colorContinuous.domain()[1]]);
      svg.append("g").attr("class", "legendElements legendAxis").attr("transform", "translate(10, 40)").call(d3.axisBottom().scale(legendScale).ticks(5)).selectAll("text").attr("class", "legend-label");
      svg.selectAll(".domain").attr("class", "legend-line");
    }
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

  // inst/htmlwidgets/myIO/src/Chart.js
  var MIN_CHART_WIDTH = 280;
  var PLOT_WIDTH_RATIO = 0.8;
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
        activeYFormat: null
      };
      this.runtime.width = !isMobile(this) && !this.config.layout.suppressLegend ? this.runtime.totalWidth * PLOT_WIDTH_RATIO : this.runtime.totalWidth;
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
      addButtons(this, layers);
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
      updateOrdinalColorLegend(this, ly);
    }
    updateRegression(color, label) {
      getRenderer("regression").renderFromPoints(this, color, label);
    }
    updateChart(newConfig) {
      this.config = newConfig;
      const newLabels = this.config.layers.map(function(layer) {
        return layer.label;
      });
      const oldLabels = this.derived.layerIndex || [];
      const removed = oldLabels.filter(function(label) {
        return !newLabels.includes(label);
      });
      this.syncLegacyAliases();
      this.renderCurrentLayers();
      this.removeLayers(removed);
    }
    resize(width, height) {
      this.runtime.totalWidth = Math.max(width, MIN_CHART_WIDTH);
      this.runtime.width = !isMobile(this) && !this.config.layout.suppressLegend ? this.runtime.totalWidth * PLOT_WIDTH_RATIO : this.runtime.totalWidth;
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
  };

  // inst/htmlwidgets/myIO/src/index.js
  registerBuiltInRenderers();
  window.myIOchart = myIOchart;
})();
/*!
 * Vendored FileSaver.js for phase-1 modularization.
 * Source: http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js
 */
