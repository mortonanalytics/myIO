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
    return "tag-" + type + "-" + elementId + "-" + String(label).replace(/[^a-zA-Z0-9_-]/g, "");
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
      var fittingTransforms = ["lm", "loess", "polynomial", "smooth"];
      if (fittingTransforms.indexOf(layer.transform) === -1) {
        this.renderPoints(chart, layer);
      }
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
      var isWhisker = layer._compositeRole === "whisker_low" || layer._compositeRole === "whisker_high";
      var isMedian = layer._compositeRole === "median";
      if (layer.mapping.low_y) {
        if (isMedian) {
          renderMedianLine(chart, layer);
        } else if (isWhisker) {
          renderWhiskerLine(chart, layer);
          renderWhiskerCaps(chart, layer);
        } else {
          renderCrosshairsY(chart, layer);
        }
      }
      if (layer.mapping.low_x) {
        renderCrosshairsX(chart, layer);
      }
      if (isWhisker || isMedian) return;
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
      chart.dom.chartArea.selectAll("." + tagName("whiskerCap", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
      chart.dom.chartArea.selectAll("." + tagName("medianLine", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
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
  function renderMedianLine(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var barHalfWidth = (layer.options && layer.options.rangeBarWidth ? layer.options.rangeBarWidth : Math.max(6, Math.min(60, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)))) / 2;
    var lines = chart.chart.selectAll("." + tagName("medianLine", chart.element.id, layer.label)).data(layer.data);
    lines.exit().transition().remove();
    lines.transition().duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) - barHalfWidth;
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) + barHalfWidth;
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    });
    lines.enter().append("line").style("fill", "none").style("stroke", "white").style("stroke-width", "2px").attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("y2", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    }).attr("class", tagName("medianLine", chart.element.id, layer.label)).transition().delay(transitionSpeed).duration(transitionSpeed).ease(d3.easeQuad).style("opacity", 1).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) - barHalfWidth;
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) + barHalfWidth;
    });
  }
  function renderWhiskerCaps(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var capHalfWidth = 8;
    var isLow = layer._compositeRole === "whisker_low";
    var capYField = isLow ? layer.mapping.low_y : layer.mapping.high_y;
    var caps = chart.chart.selectAll("." + tagName("whiskerCap", chart.element.id, layer.label)).data(layer.data);
    caps.exit().transition().remove();
    caps.transition().duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) - capHalfWidth;
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) + capHalfWidth;
    }).attr("y1", function(d) {
      return chart.yScale(d[capYField]);
    }).attr("y2", function(d) {
      return chart.yScale(d[capYField]);
    });
    caps.enter().append("line").style("fill", "none").style("stroke", "black").attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0.5).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[capYField]);
    }).attr("y2", function(d) {
      return chart.yScale(d[capYField]);
    }).attr("class", tagName("whiskerCap", chart.element.id, layer.label)).transition().delay(transitionSpeed * 2).duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) - capHalfWidth;
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]) + capHalfWidth;
    });
  }
  function renderWhiskerLine(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var isLow = layer._compositeRole === "whisker_low";
    var boxEdgeField = isLow ? layer.mapping.high_y : layer.mapping.low_y;
    var whiskerEndField = isLow ? layer.mapping.low_y : layer.mapping.high_y;
    var lines = chart.chart.selectAll("." + tagName("crosshairY", chart.element.id, layer.label)).data(layer.data);
    lines.exit().transition().remove();
    lines.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[boxEdgeField]);
    }).attr("y2", function(d) {
      return chart.yScale(d[whiskerEndField]);
    });
    lines.enter().append("line").style("fill", "none").style("stroke", "black").attr("clip-path", "url(#" + chart.element.id + "clip)").style("opacity", 0.5).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.x_var]);
    }).attr("y1", function(d) {
      return chart.yScale(d[boxEdgeField]);
    }).attr("y2", function(d) {
      return chart.yScale(d[boxEdgeField]);
    }).attr("class", tagName("crosshairY", chart.element.id, layer.label)).transition().delay(transitionSpeed).ease(d3.easeQuad).duration(transitionSpeed).attr("y2", function(d) {
      return chart.yScale(d[whiskerEndField]);
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
    static dataContract = { x_var: { required: true, numeric: true } };
    render(chart, layer) {
      var data = layer.data;
      var key = layer.label;
      var transitionSpeed = chart.options.transition.speed;
      var isVertical = layer.options && layer.options.orientation === "vertical";
      var valueArea;
      if (isVertical) {
        valueArea = d3.area().curve(d3.curveMonotoneY).y(function(d) {
          return chart.yScale(d[layer.mapping.y_var]);
        }).x0(function(d) {
          return chart.xScale(d[layer.mapping.low_x]);
        }).x1(function(d) {
          return chart.xScale(d[layer.mapping.high_x]);
        });
      } else {
        valueArea = d3.area().curve(d3.curveMonotoneX).x(function(d) {
          return chart.xScale(d[layer.mapping.x_var]);
        }).y0(function(d) {
          return chart.yScale(d[layer.mapping.low_y]);
        }).y1(function(d) {
          return chart.yScale(d[layer.mapping.high_y]);
        });
      }
      var linePath = chart.chart.selectAll("." + tagName("area", chart.element.id, key)).data([data]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
        return resolveColor(chart, d[0][layer.mapping.group], layer.color);
      }).style("opacity", 0).attr("class", tagName("area", chart.element.id, key));
      linePath.merge(newLinePath).attr("clip-path", "url(#" + chart.element.id + "clip)").transition().ease(d3.easeQuad).duration(transitionSpeed).attr("d", valueArea).style("opacity", 0.4);
    }
    formatTooltip(chart, d, layer) {
      var displayValue = d.density != null ? d.density : d[layer.mapping.high_y];
      var titleField = layer.options && layer.options.orientation === "vertical" ? layer.mapping.y_var : layer.mapping.x_var;
      var titleValue = d[titleField];
      return { title: titleField + ": " + titleValue, body: layer.label + ": " + displayValue, color: layer.color, label: layer.label, value: displayValue, raw: d };
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
    d3.select(chart.element).classed("myIO-container", true).style("position", "relative");
    chart.svg = d3.select(chart.element).append("svg").attr("class", "myIO-svg").attr("id", "myIO-svg" + chart.element.id).attr("width", chart.totalWidth).attr("height", chart.height).attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height).attr("role", "img").attr("aria-label", buildAriaLabel(chart));
    chart.svg.append("rect").attr("class", "myIO-bg").attr("width", chart.totalWidth).attr("height", chart.height).attr("fill", "var(--chart-bg, #ffffff)");
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

  // inst/htmlwidgets/myIO/src/utils/resolve-css-vars.js
  var CHART_CSS_VARS = [
    // Text & font
    "--chart-text-color",
    "--chart-font",
    "--chart-annotation-font-size",
    // Grid
    "--chart-grid-color",
    "--chart-grid-opacity",
    // Backgrounds
    "--chart-bg",
    // Reference lines
    "--chart-ref-line-color",
    "--chart-ref-line-width",
    // Annotations & accents
    "--chart-annotation-ring",
    "--chart-primary-color",
    // Brush
    "--chart-brush-fill",
    "--chart-brush-stroke",
    "--chart-brush-dim-opacity",
    // Legend
    "--chart-legend-inactive-opacity",
    // Status bar
    "--chart-status-bar-color"
  ];
  function resolveCSSVariables(svgClone, container) {
    var computed = getComputedStyle(container);
    var resolved = {};
    for (var i = 0; i < CHART_CSS_VARS.length; i++) {
      var prop = CHART_CSS_VARS[i];
      var val = computed.getPropertyValue(prop).trim();
      if (val) resolved[prop] = val;
    }
    var elements = svgClone.querySelectorAll("*");
    var allEls = [svgClone].concat(Array.prototype.slice.call(elements));
    for (var j = 0; j < allEls.length; j++) {
      var el = allEls[j];
      var style = el.getAttribute("style");
      if (style && style.indexOf("var(") !== -1) {
        var newStyle = style;
        for (var key in resolved) {
          newStyle = newStyle.split("var(" + key + ")").join(resolved[key]);
        }
        el.setAttribute("style", newStyle);
      }
      var attrs = ["fill", "stroke", "color", "stop-color"];
      for (var a = 0; a < attrs.length; a++) {
        var attrVal = el.getAttribute(attrs[a]);
        if (attrVal && attrVal.indexOf("var(") !== -1) {
          var match = attrVal.match(/var\((--[\w-]+)\)/);
          if (match && resolved[match[1]]) {
            el.setAttribute(attrs[a], resolved[match[1]]);
          }
        }
      }
    }
  }

  // inst/htmlwidgets/myIO/src/utils/export-svg.js
  function getSVGString(svgNode) {
    var svgClone = svgNode.cloneNode(true);
    var container = svgNode.parentNode || document.body;
    svgClone.setAttribute("xlink", "http://www.w3.org/1999/xlink");
    if (container && typeof getComputedStyle === "function") {
      resolveCSSVariables(svgClone, container);
    }
    var cssStyleText = getCSSStyles(svgClone);
    appendCSS(cssStyleText, svgClone);
    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgClone);
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
  function downloadSVG(svgNode, filename) {
    var svgString = getSVGString(svgNode);
    var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || "chart.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    } else if (layer.type === "funnel" && Array.isArray(layer.data)) {
      keys = layer.data.map(function(d) {
        return d[layer.mapping.stage];
      });
    } else if (layer.type === "radar" && Array.isArray(layer.data)) {
      keys = layer.mapping.group ? Array.from(new Set(layer.data.map(function(d) {
        return d[layer.mapping.group];
      }))) : [layer.label];
    } else if (layer.type === "parallel" && Array.isArray(layer.data)) {
      keys = layer.mapping.group ? Array.from(new Set(layer.data.map(function(d) {
        return d[layer.mapping.group];
      }))) : [layer.label];
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

  // inst/htmlwidgets/myIO/src/utils/export-legend.js
  var LEGEND_PADDING = 16;
  var SWATCH_SIZE = 12;
  var SWATCH_GAP = 6;
  var ITEM_GAP = 18;
  var ROW_GAP = 6;
  var FONT_SIZE = 12;
  var GRADIENT_HEIGHT = 14;
  var GRADIENT_WIDTH = 180;
  function injectExportLegend(chart) {
    var legendData = buildLegendData(chart, chart.runtime && chart.runtime._legendState);
    if (!legendData || !legendData.type) {
      return { extraHeight: 0, cleanup: function() {
      } };
    }
    var visibleItems = legendData.items ? legendData.items.filter(function(d) {
      return d.visible !== false;
    }) : [];
    if (legendData.type !== "continuous" && visibleItems.length === 0) {
      return { extraHeight: 0, cleanup: function() {
      } };
    }
    var svgNode = chart.svg.node();
    var svgWidth = parseFloat(svgNode.getAttribute("width")) || chart.totalWidth || chart.width;
    var origHeight = parseFloat(svgNode.getAttribute("height")) || chart.height;
    var origViewBox = svgNode.getAttribute("viewBox");
    var textColor = getTextColor(chart);
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "myIO-export-legend");
    var extraHeight;
    if (legendData.type === "continuous") {
      extraHeight = buildContinuousLegendSVG(g, legendData, svgWidth, textColor);
    } else {
      extraHeight = buildDiscreteLegendSVG(g, visibleItems, svgWidth, textColor);
    }
    g.setAttribute("transform", "translate(0," + origHeight + ")");
    var newHeight = origHeight + extraHeight;
    svgNode.appendChild(g);
    svgNode.setAttribute("height", newHeight);
    svgNode.setAttribute("viewBox", "0 0 " + svgWidth + " " + newHeight);
    return {
      extraHeight,
      cleanup: function() {
        svgNode.removeChild(g);
        svgNode.setAttribute("height", origHeight);
        svgNode.setAttribute("viewBox", origViewBox);
      }
    };
  }
  function buildDiscreteLegendSVG(g, items, svgWidth, textColor) {
    var usableWidth = svgWidth - LEGEND_PADDING * 2;
    var x = LEGEND_PADDING;
    var y = LEGEND_PADDING;
    var rowHeight = Math.max(SWATCH_SIZE, FONT_SIZE);
    items.forEach(function(item) {
      var labelWidth = estimateTextWidth(item.label, FONT_SIZE);
      var itemWidth = SWATCH_SIZE + SWATCH_GAP + labelWidth;
      if (x + itemWidth > LEGEND_PADDING + usableWidth && x > LEGEND_PADDING) {
        x = LEGEND_PADDING;
        y += rowHeight + ROW_GAP;
      }
      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", SWATCH_SIZE);
      rect.setAttribute("height", SWATCH_SIZE);
      rect.setAttribute("rx", 2);
      rect.setAttribute("fill", item.color || "#6b7280");
      g.appendChild(rect);
      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x + SWATCH_SIZE + SWATCH_GAP);
      text.setAttribute("y", y + SWATCH_SIZE - 1);
      text.setAttribute("font-family", "Roboto, Arial, sans-serif");
      text.setAttribute("font-size", FONT_SIZE);
      text.setAttribute("fill", textColor);
      text.textContent = item.label;
      g.appendChild(text);
      x += itemWidth + ITEM_GAP;
    });
    return y + rowHeight + LEGEND_PADDING;
  }
  function buildContinuousLegendSVG(g, legendData, svgWidth, textColor) {
    var scale = legendData.colorScale;
    if (!scale) {
      return 0;
    }
    var domain = legendData.domain || scale.domain();
    var y = LEGEND_PADDING;
    var gradientX = (svgWidth - GRADIENT_WIDTH) / 2;
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var linearGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    var gradId = "export-legend-grad-" + Date.now();
    linearGrad.setAttribute("id", gradId);
    var steps = 8;
    var min = domain[0];
    var max = domain[domain.length - 1];
    for (var i = 0; i < steps; i++) {
      var t = steps === 1 ? 0 : i / (steps - 1);
      var value = min + (max - min) * t;
      var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop.setAttribute("offset", Math.round(t * 100) + "%");
      stop.setAttribute("stop-color", scale(value));
      linearGrad.appendChild(stop);
    }
    defs.appendChild(linearGrad);
    g.appendChild(defs);
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", gradientX);
    rect.setAttribute("y", y);
    rect.setAttribute("width", GRADIENT_WIDTH);
    rect.setAttribute("height", GRADIENT_HEIGHT);
    rect.setAttribute("rx", 3);
    rect.setAttribute("fill", "url(#" + gradId + ")");
    g.appendChild(rect);
    var ticks = [];
    if (typeof scale.ticks === "function") {
      ticks = scale.ticks(5).map(String);
    } else {
      ticks = [String(min), String(max)];
    }
    var tickY = y + GRADIENT_HEIGHT + FONT_SIZE + 4;
    ticks.forEach(function(tick, idx) {
      var tickT = ticks.length === 1 ? 0.5 : idx / (ticks.length - 1);
      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", gradientX + tickT * GRADIENT_WIDTH);
      text.setAttribute("y", tickY);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-family", "Roboto, Arial, sans-serif");
      text.setAttribute("font-size", FONT_SIZE);
      text.setAttribute("fill", textColor);
      text.textContent = tick;
      g.appendChild(text);
    });
    return tickY + LEGEND_PADDING;
  }
  function estimateTextWidth(str, fontSize) {
    return (str || "").length * fontSize * 0.6;
  }
  function getTextColor(chart) {
    var el = chart.element || chart.svg && chart.svg.node && chart.svg.node().parentNode;
    if (el && typeof getComputedStyle === "function") {
      var val = getComputedStyle(el).getPropertyValue("--chart-text-color");
      if (val && val.trim()) {
        return val.trim();
      }
    }
    return "#6b7280";
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
    svg: "Download as SVG",
    chart: "Download CSV data",
    percent: "Toggle percent view",
    group2stack: "Toggle grouped/stacked layout"
  };
  function handleAction(chart, layers, name) {
    if (name === "svg") {
      var svgLegend = injectExportLegend(chart);
      if (typeof saveAs === "function") {
        var svgString = getSVGString(chart.svg.node());
        svgLegend.cleanup();
        var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        saveAs(blob, chart.element.id + ".svg");
      } else {
        downloadSVG(chart.svg.node(), chart.element.id + ".svg");
        svgLegend.cleanup();
      }
      return;
    }
    if (name === "image") {
      var legend = injectExportLegend(chart);
      var exportHeight = chart.height + legend.extraHeight;
      var svgString = getSVGString(chart.svg.node());
      legend.cleanup();
      svgString2Image(svgString, 2 * chart.width, 2 * exportHeight, "png", function(dataBlob) {
        saveAs(dataBlob, chart.element.id + ".png");
      });
      return;
    }
    if (name === "chart") {
      var csvData = [];
      var brushed = chart.runtime._brushed;
      if (brushed && brushed.data.length > 0 && chart.config.interactions.brush && chart.config.interactions.brush.onSelect === "export") {
        csvData.push(brushed.data);
      } else {
        chart.plotLayers.forEach(function(layer) {
          csvData.push(layer.data);
        });
      }
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
      var newCells = cells.enter().append("rect").attr("class", tagName("heatmap", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
        return chart.xScale(d[xVar]);
      }).attr("y", function(d) {
        return chart.yScale(d[yVar]);
      }).attr("width", cellWidth).attr("height", cellHeight).attr("fill", function(d) {
        return chart.colorContinuous(+d[valueVar]);
      }).style("opacity", 0);
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
      var chartWidth = chart.width - (chart.margin.left + chart.margin.right);
      var width = Math.max(6, Math.min(40, chartWidth / Math.max(layer.data.length * 2.5, 1)));
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
      var newBars = bars.enter().append("rect").attr("class", tagName("waterfall", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
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
      }).style("opacity", 0);
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
      var newConnectors = connectorLines.enter().append("line").attr("class", tagName("waterfall-connector", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").style("stroke", "#666").style("stroke-width", 1.5).style("stroke-dasharray", "4 2").attr("x1", function(d, i) {
        return chart.xScale(layer.data[i][xVar]) + bandwidth;
      }).attr("x2", function(d, i) {
        return chart.xScale(layer.data[i + 1][xVar]);
      }).attr("y1", function(d) {
        return chart.yScale(+d._cumulative_y);
      }).attr("y2", function(d) {
        return chart.yScale(+d._cumulative_y);
      }).style("opacity", 0);
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
      var newLink = link.enter().append("path").attr("class", tagName("sankey", chart.element.id, layer.label)).attr("fill", "none").attr("stroke-opacity", 0.4).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("d", d3.sankeyLinkHorizontal()).attr("stroke-width", function(d) {
        return Math.max(1, d.width);
      }).attr("stroke", function(d) {
        return chart.colorDiscrete(d.source.name);
      }).style("opacity", 0);
      link.merge(newLink).transition().ease(d3.easeQuad).duration(chart.options.transition.speed).style("opacity", 1).attr("d", d3.sankeyLinkHorizontal()).attr("stroke-width", function(d) {
        return Math.max(1, d.width);
      }).attr("stroke", function(d) {
        return chart.colorDiscrete(d.source.name);
      });
      var node = chart.chart.selectAll("." + tagName("sankey-node", chart.element.id, layer.label)).data(graph.nodes);
      node.exit().transition().duration(chart.options.transition.speed).style("opacity", 0).remove();
      var newNode = node.enter().append("rect").attr("class", tagName("sankey-node", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
        return d.x0;
      }).attr("y", function(d) {
        return d.y0;
      }).attr("width", function(d) {
        return d.x1 - d.x0;
      }).attr("height", function(d) {
        return Math.max(1, d.y1 - d.y0);
      }).attr("fill", function(d) {
        return chart.colorDiscrete(d.name);
      }).style("opacity", 0);
      node.merge(newNode).transition().ease(d3.easeQuad).duration(chart.options.transition.speed).style("opacity", 1).attr("x", function(d) {
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
      var labelClass = tagName("sankey-label", chart.element.id, layer.label);
      chart.chart.selectAll("." + labelClass).remove();
      graph.nodes.forEach(function(d) {
        var isLeft = d.x0 < width / 2;
        chart.chart.append("text").attr("class", labelClass).attr("x", isLeft ? d.x1 + 6 : d.x0 - 6).attr("y", (d.y0 + d.y1) / 2).attr("dy", "0.35em").attr("text-anchor", isLeft ? "start" : "end").style("font-size", "12px").style("fill", "var(--chart-text-color, #333)").text(d.name);
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
      chart.dom.chartArea.selectAll("." + tagName("sankey-label", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/RangeBarRenderer.js
  var RangeBarRenderer = class {
    static type = "rangeBar";
    static traits = { hasAxes: true, referenceLines: false, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
    static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["low_y", "high_y"], domainMerge: "union" };
    static dataContract = { x_var: { required: true }, low_y: { required: true, numeric: true }, high_y: { required: true, numeric: true } };
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var xVar = layer.mapping.x_var;
      var lowVar = layer.mapping.low_y;
      var highVar = layer.mapping.high_y;
      var barWidth = layer.options && layer.options.rangeBarWidth ? layer.options.rangeBarWidth : Math.max(6, Math.min(60, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)));
      var bars = chart.chart.selectAll("." + tagName("rangeBar", chart.element.id, layer.label)).data(layer.data);
      bars.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newBars = bars.enter().append("rect").attr("class", tagName("rangeBar", chart.element.id, layer.label)).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("x", function(d) {
        return chart.xScale(d[xVar]) - barWidth / 2;
      }).attr("y", function(d) {
        return chart.yScale(Math.max(+d[lowVar], +d[highVar]));
      }).attr("width", barWidth).attr("height", function(d) {
        return Math.abs(chart.yScale(+d[lowVar]) - chart.yScale(+d[highVar]));
      }).attr("fill", function(d) {
        if (typeof chart.colorDiscrete === "function" && d[layer.mapping.group]) {
          return chart.colorDiscrete(d[layer.mapping.group]);
        }
        return layer.color || "#6b7280";
      }).style("opacity", 0);
      bars.merge(newBars).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("x", function(d) {
        return chart.xScale(d[xVar]) - barWidth / 2;
      }).attr("y", function(d) {
        return chart.yScale(Math.max(+d[lowVar], +d[highVar]));
      }).attr("width", barWidth).attr("height", function(d) {
        return Math.abs(chart.yScale(+d[lowVar]) - chart.yScale(+d[highVar]));
      }).attr("fill", function(d) {
        if (typeof chart.colorDiscrete === "function" && d[layer.mapping.group]) {
          return chart.colorDiscrete(d[layer.mapping.group]);
        }
        return layer.color || "#6b7280";
      }).style("opacity", 1);
    }
    getHoverSelector(chart, layer) {
      return "." + tagName("rangeBar", chart.dom.element.id, layer.label);
    }
    formatTooltip(chart, d, layer) {
      return {
        title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
        body: layer.mapping.low_y + ": " + d[layer.mapping.low_y] + ", " + layer.mapping.high_y + ": " + d[layer.mapping.high_y],
        color: layer.color,
        label: layer.label,
        value: d[layer.mapping.high_y],
        raw: d
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll("." + tagName("rangeBar", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/TextRenderer.js
  var TextRenderer = class {
    static type = "text";
    static traits = {
      hasAxes: false,
      referenceLines: false,
      legendType: "none",
      binning: false,
      rolloverStyle: "none",
      scaleCapabilities: { invertX: false }
    };
    static scaleHints = {
      xScaleType: "linear",
      yScaleType: "linear",
      xExtentFields: [],
      yExtentFields: [],
      domainMerge: "union"
    };
    static dataContract = {};
    render(chart, layer) {
      var position = layer.options && layer.options.position || "top-right";
      var key = layer.label;
      var className = tagName("text-annotation", chart.element.id, key);
      chart.chart.selectAll("." + className).remove();
      var lines = layer.data.map(function(d) {
        return d.text;
      });
      var isTop = position.indexOf("top") !== -1;
      var isRight = position.indexOf("right") !== -1;
      var x = isRight ? chart.width - 10 : 10;
      var y = isTop ? 20 : chart.height - 10;
      var anchor = isRight ? "end" : "start";
      var g = chart.chart.append("g").attr("class", className).attr("transform", "translate(" + x + "," + y + ")");
      lines.forEach(function(line, i) {
        g.append("text").attr("y", (isTop ? 1 : -1) * i * 16).attr("text-anchor", anchor).style("font-size", "12px").style("font-family", "var(--font-family, sans-serif)").style("fill", "var(--text-color, #333)").style("opacity", 0.8).text(line);
      });
    }
    formatTooltip() {
      return null;
    }
    remove(chart, layer) {
      var className = tagName("text-annotation", chart.dom.element.id, layer.label);
      chart.dom.chartArea.selectAll("." + className).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/BracketRenderer.js
  var BracketRenderer = class {
    static type = "bracket";
    static traits = {
      hasAxes: true,
      referenceLines: false,
      legendType: "none",
      binning: false,
      rolloverStyle: "none",
      scaleCapabilities: { invertX: false }
    };
    static scaleHints = {
      xScaleType: "linear",
      yScaleType: "linear",
      xExtentFields: [],
      yExtentFields: ["y"],
      domainMerge: "union"
    };
    static dataContract = {
      x1: { required: true, numeric: true },
      x2: { required: true, numeric: true },
      y: { required: true, numeric: true }
    };
    render(chart, layer) {
      var className = tagName("bracket", chart.element.id, layer.label);
      var tickHeight = 6;
      var labelOffset = 4;
      var transitionSpeed = chart.options.transition.speed;
      var color = layer.color || "var(--text-color, #333)";
      chart.chart.selectAll("." + className).remove();
      var g = chart.chart.append("g").attr("class", className).attr("clip-path", "url(#" + chart.element.id + "clip)");
      layer.data.forEach(function(d) {
        var sx1 = chart.xScale(+d.x1);
        var sx2 = chart.xScale(+d.x2);
        var sy = chart.yScale(+d.y);
        var bracket = g.append("g").style("opacity", 0);
        bracket.append("line").attr("x1", sx1).attr("y1", sy).attr("x2", sx2).attr("y2", sy).attr("stroke", color).attr("stroke-width", 1.5);
        bracket.append("line").attr("x1", sx1).attr("y1", sy).attr("x2", sx1).attr("y2", sy + tickHeight).attr("stroke", color).attr("stroke-width", 1.5);
        bracket.append("line").attr("x1", sx2).attr("y1", sy).attr("x2", sx2).attr("y2", sy + tickHeight).attr("stroke", color).attr("stroke-width", 1.5);
        bracket.append("text").attr("x", (sx1 + sx2) / 2).attr("y", sy - labelOffset).attr("text-anchor", "middle").style("font-size", "11px").style("font-family", "var(--font-family, sans-serif)").style("fill", color).text(d.label);
        bracket.transition().duration(transitionSpeed).style("opacity", 1);
      });
    }
    formatTooltip() {
      return null;
    }
    remove(chart, layer) {
      var className = tagName("bracket", chart.element.id, layer.label);
      chart.chart.selectAll("." + className).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/LollipopRenderer.js
  var LollipopRenderer = class {
    static type = "lollipop";
    static traits = {
      hasAxes: true,
      referenceLines: true,
      legendType: "layer",
      binning: false,
      rolloverStyle: "element",
      scaleCapabilities: { invertX: false }
    };
    static scaleHints = {
      xScaleType: "band",
      yScaleType: "linear",
      xExtentFields: [],
      yExtentFields: ["y_var"],
      domainMerge: "union"
    };
    static dataContract = {
      x_var: { required: true, numeric: false },
      y_var: { required: true, numeric: true }
    };
    render(chart, layer, layers) {
      var xScale = chart.derived.xScale;
      var yScale = chart.derived.yScale;
      var flipAxis = chart.config.scales.flipAxis;
      var speed = chart.config.transitions.speed;
      var group = chart.dom.chartArea.selectAll(".tag-lollipop-" + layer.id).data([null]).join("g").attr("class", "tag-lollipop-" + layer.id);
      var headRadius = layer.options && layer.options.headRadius || 5;
      var stemWidth = layer.options && layer.options.stemWidth || 2;
      var xVar = layer.mapping.x_var;
      var yVar = layer.mapping.y_var;
      var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
      var baseline = typeof yScale(0) === "number" ? yScale(0) : yScale.range()[0];
      var stems = group.selectAll(".lollipop-stem").data(layer.data, function(d) {
        return d._source_key;
      });
      stems.exit().transition().duration(speed).style("opacity", 0).remove();
      if (flipAxis) {
        stems.join("line").attr("class", "lollipop-stem").transition().duration(speed).attr("x1", 0).attr("x2", function(d) {
          return xScale(d[xVar]);
        }).attr("y1", function(d) {
          return yScale(d[yVar]) + bandOffset;
        }).attr("y2", function(d) {
          return yScale(d[yVar]) + bandOffset;
        }).attr("stroke", layer.color).attr("stroke-width", stemWidth);
      } else {
        stems.join("line").attr("class", "lollipop-stem").transition().duration(speed).attr("x1", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("x2", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("y1", baseline).attr("y2", function(d) {
          return yScale(d[yVar]);
        }).attr("stroke", layer.color).attr("stroke-width", stemWidth);
      }
      var heads = group.selectAll(".lollipop-head").data(layer.data, function(d) {
        return d._source_key;
      });
      heads.exit().transition().duration(speed).style("opacity", 0).remove();
      if (flipAxis) {
        heads.join("circle").attr("class", "lollipop-head").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[xVar]);
        }).attr("cy", function(d) {
          return yScale(d[yVar]) + bandOffset;
        }).attr("r", headRadius).attr("fill", layer.color);
      } else {
        heads.join("circle").attr("class", "lollipop-head").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("cy", function(d) {
          return yScale(d[yVar]);
        }).attr("r", headRadius).attr("fill", layer.color);
      }
    }
    getHoverSelector(chart, layer) {
      return ".tag-lollipop-" + layer.id + " .lollipop-head";
    }
    formatTooltip(chart, d, layer) {
      var yFormat = chart.runtime.activeYFormat || d3.format("s");
      return {
        title: { text: String(d[layer.mapping.x_var]) },
        items: [{
          color: layer.color,
          label: layer.label,
          value: yFormat(d[layer.mapping.y_var])
        }]
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-lollipop-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/DumbbellRenderer.js
  var DumbbellRenderer = class {
    static type = "dumbbell";
    static traits = {
      hasAxes: true,
      referenceLines: true,
      legendType: "layer",
      binning: false,
      rolloverStyle: "element",
      scaleCapabilities: { invertX: false }
    };
    static scaleHints = {
      xScaleType: "band",
      yScaleType: "linear",
      xExtentFields: [],
      yExtentFields: ["low_y", "high_y"],
      domainMerge: "union"
    };
    static dataContract = {
      x_var: { required: true, numeric: false },
      low_y: { required: true, numeric: true },
      high_y: { required: true, numeric: true }
    };
    render(chart, layer, layers) {
      var xScale = chart.derived.xScale;
      var yScale = chart.derived.yScale;
      var flipAxis = chart.config.scales.flipAxis;
      var speed = chart.config.transitions.speed;
      var group = chart.dom.chartArea.selectAll(".tag-dumbbell-" + layer.id).data([null]).join("g").attr("class", "tag-dumbbell-" + layer.id);
      var dotRadius = layer.options && layer.options.dotRadius || 5;
      var lineWidth = layer.options && layer.options.lineWidth || 2;
      var xVar = layer.mapping.x_var;
      var lowVar = layer.mapping.low_y;
      var highVar = layer.mapping.high_y;
      var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
      var lines = group.selectAll(".dumbbell-line").data(layer.data, function(d) {
        return d._source_key;
      });
      lines.exit().transition().duration(speed).style("opacity", 0).remove();
      if (flipAxis) {
        lines.join("line").attr("class", "dumbbell-line").transition().duration(speed).attr("x1", function(d) {
          return xScale(d[lowVar]);
        }).attr("x2", function(d) {
          return xScale(d[highVar]);
        }).attr("y1", function(d) {
          return yScale(d[xVar]) + bandOffset;
        }).attr("y2", function(d) {
          return yScale(d[xVar]) + bandOffset;
        }).attr("stroke", "var(--chart-grid-color, #ccc)").attr("stroke-width", lineWidth);
      } else {
        lines.join("line").attr("class", "dumbbell-line").transition().duration(speed).attr("x1", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("x2", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("y1", function(d) {
          return yScale(d[lowVar]);
        }).attr("y2", function(d) {
          return yScale(d[highVar]);
        }).attr("stroke", "var(--chart-grid-color, #ccc)").attr("stroke-width", lineWidth);
      }
      var lowDots = group.selectAll(".dumbbell-low").data(layer.data, function(d) {
        return d._source_key;
      });
      lowDots.exit().transition().duration(speed).style("opacity", 0).remove();
      if (flipAxis) {
        lowDots.join("circle").attr("class", "dumbbell-low").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[lowVar]);
        }).attr("cy", function(d) {
          return yScale(d[xVar]) + bandOffset;
        }).attr("r", dotRadius).attr("fill", layer.color).attr("opacity", 0.6);
      } else {
        lowDots.join("circle").attr("class", "dumbbell-low").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("cy", function(d) {
          return yScale(d[lowVar]);
        }).attr("r", dotRadius).attr("fill", layer.color).attr("opacity", 0.6);
      }
      var highDots = group.selectAll(".dumbbell-high").data(layer.data, function(d) {
        return d._source_key;
      });
      highDots.exit().transition().duration(speed).style("opacity", 0).remove();
      if (flipAxis) {
        highDots.join("circle").attr("class", "dumbbell-high").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[highVar]);
        }).attr("cy", function(d) {
          return yScale(d[xVar]) + bandOffset;
        }).attr("r", dotRadius).attr("fill", layer.color);
      } else {
        highDots.join("circle").attr("class", "dumbbell-high").transition().duration(speed).attr("cx", function(d) {
          return xScale(d[xVar]) + bandOffset;
        }).attr("cy", function(d) {
          return yScale(d[highVar]);
        }).attr("r", dotRadius).attr("fill", layer.color);
      }
    }
    getHoverSelector(chart, layer) {
      return ".tag-dumbbell-" + layer.id + " .dumbbell-high, .tag-dumbbell-" + layer.id + " .dumbbell-low";
    }
    formatTooltip(chart, d, layer) {
      var yFormat = chart.runtime.activeYFormat || d3.format("s");
      return {
        title: { text: String(d[layer.mapping.x_var]) },
        items: [
          { color: layer.color, label: "Low", value: yFormat(d[layer.mapping.low_y]) },
          { color: layer.color, label: "High", value: yFormat(d[layer.mapping.high_y]) }
        ]
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-dumbbell-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/WaffleRenderer.js
  var WaffleRenderer = class {
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
      var rows = layer.options && layer.options.rows || 10;
      var cols = layer.options && layer.options.cols || 10;
      var totalCells = rows * cols;
      var cellGap = layer.options && layer.options.cellGap || 2;
      var cellRadius = layer.options && layer.options.cellRadius || 2;
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
      for (var i = 0; i < layer.data.length; i++) {
        var d = layer.data[i];
        var count = Math.round(d[layer.mapping.value] / total * totalCells);
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
      var group = chart.dom.chartArea.selectAll(".tag-waffle-" + layer.id).data([null]).join("g").attr("class", "tag-waffle-" + layer.id).attr("transform", "translate(" + offsetX + "," + offsetY + ")");
      group.selectAll(".waffle-cell").data(cells).join("rect").attr("class", "waffle-cell").attr("x", function(d2) {
        return d2.col * (cellSize + cellGap);
      }).attr("y", function(d2) {
        return d2.row * (cellSize + cellGap);
      }).attr("width", cellSize).attr("height", cellSize).attr("rx", cellRadius).attr("fill", function(d2) {
        return d2.color;
      });
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
  };

  // inst/htmlwidgets/myIO/src/renderers/BeeswarmRenderer.js
  var BeeswarmRenderer = class {
    static type = "beeswarm";
    static traits = {
      hasAxes: true,
      referenceLines: true,
      legendType: "layer",
      binning: false,
      rolloverStyle: "element",
      scaleCapabilities: { invertX: false }
    };
    static scaleHints = {
      xScaleType: "linear",
      yScaleType: "linear",
      xExtentFields: ["x_var"],
      yExtentFields: ["y_var"],
      domainMerge: "union"
    };
    static dataContract = {
      x_var: { required: true, numeric: true },
      y_var: { required: true }
    };
    render(chart, layer) {
      var xScale = chart.derived.xScale;
      var yScale = chart.derived.yScale;
      var radius = layer.options && layer.options.radius || 3;
      var padding = layer.options && layer.options.padding || 1;
      var xVar = layer.mapping.x_var;
      var yVar = layer.mapping.y_var;
      var data = layer.data.slice().sort(function(a, b) {
        return xScale(a[xVar]) - xScale(b[xVar]);
      });
      var placed = [];
      var diameter = 2 * radius + padding;
      for (var i = 0; i < data.length; i++) {
        var cx = xScale(data[i][xVar]);
        var baseY = yScale(data[i][yVar]);
        var dy = 0;
        var found = false;
        for (var attempt = 0; attempt < 500 && !found; attempt++) {
          var candidateY = attempt === 0 ? baseY : attempt % 2 === 1 ? baseY + Math.ceil(attempt / 2) * diameter : baseY - Math.ceil(attempt / 2) * diameter;
          var collision = false;
          for (var j = 0; j < placed.length; j++) {
            var dx2 = cx - placed[j].cx;
            var dy2 = candidateY - placed[j].cy;
            if (dx2 * dx2 + dy2 * dy2 < diameter * diameter) {
              collision = true;
              break;
            }
          }
          if (!collision) {
            dy = candidateY;
            found = true;
          }
        }
        data[i]._beeswarm_cx = cx;
        data[i]._beeswarm_cy = dy;
        placed.push({ cx, cy: dy });
      }
      var group = chart.dom.chartArea.selectAll(".tag-beeswarm-" + layer.id).data([null]).join("g").attr("class", "tag-beeswarm-" + layer.id);
      group.selectAll(".beeswarm-point").data(data, function(d) {
        return d._source_key;
      }).join("circle").attr("class", "beeswarm-point").attr("cx", function(d) {
        return d._beeswarm_cx;
      }).attr("cy", function(d) {
        return d._beeswarm_cy;
      }).attr("r", radius).attr("fill", layer.color).attr("fill-opacity", 0.7);
    }
    getHoverSelector(chart, layer) {
      return ".tag-beeswarm-" + layer.id + " .beeswarm-point";
    }
    formatTooltip(chart, d, layer) {
      var yFormat = chart.runtime.activeYFormat || d3.format("s");
      return {
        title: { text: String(d[layer.mapping.x_var]) },
        items: [{ color: layer.color, label: layer.label, value: yFormat(d[layer.mapping.y_var]) }]
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-beeswarm-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/BumpRenderer.js
  var BumpRenderer = class {
    static type = "bump";
    static traits = {
      hasAxes: true,
      referenceLines: false,
      legendType: "layer",
      binning: false,
      rolloverStyle: "element",
      scaleCapabilities: {}
    };
    static scaleHints = {
      xScaleType: "point",
      yScaleType: "linear",
      xExtentFields: [],
      yExtentFields: ["y_var"],
      domainMerge: "union"
    };
    static dataContract = {
      x_var: { required: true },
      y_var: { required: true, numeric: true },
      group: { required: true }
    };
    render(chart, layer) {
      var xScale = chart.derived.xScale;
      var yScale = chart.derived.yScale;
      var xVar = layer.mapping.x_var;
      var yVar = layer.mapping.y_var;
      var groupVar = layer.mapping.group;
      var dotRadius = layer.options && layer.options.dotRadius || 5;
      var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);
      var groups = d3.group(layer.data, function(d) {
        return d[groupVar];
      });
      var group = chart.dom.chartArea.selectAll(".tag-bump-" + layer.id).data([null]).join("g").attr("class", "tag-bump-" + layer.id);
      var line = d3.line().x(function(d) {
        return xScale(d[xVar]);
      }).y(function(d) {
        return yScale(d[yVar]);
      }).curve(d3.curveBumpX);
      var groupIndex = 0;
      groups.forEach(function(data, name) {
        var color = colorScale(name);
        var sorted = data.slice().sort(function(a, b) {
          return String(a[xVar]).localeCompare(String(b[xVar]));
        });
        group.selectAll(".bump-line-" + groupIndex).data([sorted]).join("path").attr("class", "bump-line bump-line-" + groupIndex).attr("d", line).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.5).attr("stroke-opacity", 0.8);
        group.selectAll(".bump-dot-" + groupIndex).data(sorted).join("circle").attr("class", "bump-dot bump-dot-" + groupIndex).attr("cx", function(d) {
          return xScale(d[xVar]);
        }).attr("cy", function(d) {
          return yScale(d[yVar]);
        }).attr("r", dotRadius).attr("fill", color).attr("stroke", "#fff").attr("stroke-width", 1.5);
        groupIndex++;
      });
    }
    getHoverSelector(chart, layer) {
      return ".tag-bump-" + layer.id + " .bump-dot";
    }
    formatTooltip(chart, d, layer) {
      return {
        title: { text: String(d[layer.mapping.group]) },
        items: [
          { color: layer.color, label: String(d[layer.mapping.x_var]), value: String(d[layer.mapping.y_var]) }
        ]
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-bump-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/RadarRenderer.js
  var RadarRenderer = class {
    static type = "radar";
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
      axis: { required: true },
      value: { required: true, numeric: true }
    };
    render(chart, layer) {
      var margin = chart.margin || (chart.config && chart.config.layout ? chart.config.layout.margin : { top: 0, right: 0, bottom: 0, left: 0 });
      var width = (chart.width || chart.runtime && chart.runtime.width || 0) - margin.left - margin.right;
      var height = (chart.height || chart.runtime && chart.runtime.height || 0) - margin.top - margin.bottom;
      var axisVar = layer.mapping.axis;
      var valueVar = layer.mapping.value;
      var groupVar = layer.mapping.group;
      var labelOffset = layer.options && layer.options.labelOffset || 16;
      var centerX = width / 2;
      var centerY = height / 2;
      var maxRadius = Math.max(0, Math.min(width, height) / 2 - labelOffset - 8);
      var axisOrder = [];
      var axisSeen = /* @__PURE__ */ new Set();
      var maxValue = d3.max(layer.data, function(d) {
        return +d[valueVar];
      }) || 0;
      var radiusScale = d3.scaleLinear().domain([0, maxValue > 0 ? maxValue : 1]).range([0, maxRadius]);
      var groups = [];
      var groupMap = groupVar ? d3.group(layer.data, function(d) {
        return d[groupVar];
      }) : /* @__PURE__ */ new Map([[layer.label || "Series", layer.data]]);
      var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);
      var axisCount;
      var root;
      var axisLayer;
      var polygonLayer;
      var lineGenerator;
      layer.data.forEach(function(d) {
        var axisName = d[axisVar];
        if (!axisSeen.has(axisName)) {
          axisSeen.add(axisName);
          axisOrder.push(axisName);
        }
      });
      axisCount = axisOrder.length;
      if (axisCount === 0) {
        return;
      }
      root = chart.dom.chartArea.selectAll(".tag-radar-" + layer.id).data([null]).join("g").attr("class", "tag-radar-" + layer.id);
      axisLayer = root.selectAll(".radar-axis-layer").data([null]).join("g").attr("class", "radar-axis-layer");
      polygonLayer = root.selectAll(".radar-polygon-layer").data([null]).join("g").attr("class", "radar-polygon-layer");
      axisLayer.selectAll(".radar-axis").data(axisOrder).join(function(enter) {
        var group = enter.append("g").attr("class", "radar-axis");
        group.append("line").attr("class", "radar-axis-line");
        group.append("text").attr("class", "radar-axis-label");
        return group;
      }).each(function(axisName, index) {
        var angle = 2 * Math.PI * index / axisCount;
        var lineX = centerX + maxRadius * Math.sin(angle);
        var lineY = centerY - maxRadius * Math.cos(angle);
        var labelX = centerX + (maxRadius + labelOffset) * Math.sin(angle);
        var labelY = centerY - (maxRadius + labelOffset) * Math.cos(angle);
        var textAnchor = "middle";
        if (Math.sin(angle) > 0.25) {
          textAnchor = "start";
        } else if (Math.sin(angle) < -0.25) {
          textAnchor = "end";
        }
        d3.select(this).select(".radar-axis-line").attr("x1", centerX).attr("y1", centerY).attr("x2", lineX).attr("y2", lineY);
        d3.select(this).select(".radar-axis-label").attr("x", labelX).attr("y", labelY).attr("dy", "0.35em").attr("text-anchor", textAnchor).text(axisName);
      });
      groupMap.forEach(function(rows, key) {
        var rowByAxis = /* @__PURE__ */ new Map();
        var polygonPoints = [];
        rows.forEach(function(d) {
          rowByAxis.set(d[axisVar], d);
        });
        axisOrder.forEach(function(axisName, index) {
          var angle = 2 * Math.PI * index / axisCount;
          var datum = rowByAxis.get(axisName);
          var rawValue = datum ? +datum[valueVar] : 0;
          var scaledRadius = radiusScale(Number.isFinite(rawValue) ? rawValue : 0);
          polygonPoints.push({
            axis: axisName,
            angle,
            value: Number.isFinite(rawValue) ? rawValue : 0,
            x: centerX + scaledRadius * Math.sin(angle),
            y: centerY - scaledRadius * Math.cos(angle),
            datum: datum || null
          });
        });
        groups.push({
          key,
          color: colorScale(key),
          points: polygonPoints,
          rows
        });
      });
      chart.derived.colorDiscrete = colorScale.domain(groups.map(function(group) {
        return group.key;
      }));
      chart.colorDiscrete = chart.derived.colorDiscrete;
      lineGenerator = d3.line().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      }).curve(d3.curveLinearClosed);
      polygonLayer.selectAll(".radar-polygon").data(groups).join("path").attr("class", "radar-polygon").attr("d", function(d) {
        return lineGenerator(d.points);
      }).attr("fill", function(d) {
        return d.color;
      }).attr("fill-opacity", 0.2).attr("stroke", function(d) {
        return d.color;
      }).attr("stroke-width", 2);
    }
    getHoverSelector(chart, layer) {
      return ".tag-radar-" + layer.id + " .radar-polygon";
    }
    formatTooltip(chart, d) {
      return {
        title: { text: String(d.key) },
        items: d.points.map(function(point) {
          return {
            color: d.color,
            label: point.axis,
            value: String(point.value)
          };
        })
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-radar-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/FunnelRenderer.js
  var FunnelRenderer = class {
    static type = "funnel";
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
      stage: { required: true },
      value: { required: true, numeric: true }
    };
    render(chart, layer) {
      var margin = chart.margin || (chart.config && chart.config.layout ? chart.config.layout.margin : { top: 0, right: 0, bottom: 0, left: 0 });
      var width = (chart.width || chart.runtime && chart.runtime.width || 0) - margin.left - margin.right;
      var height = (chart.height || chart.runtime && chart.runtime.height || 0) - margin.top - margin.bottom;
      var stageVar = layer.mapping.stage;
      var valueVar = layer.mapping.value;
      var stageGap = layer.options && layer.options.stageGap || 6;
      var maxValue = d3.max(layer.data, function(d) {
        return +d[valueVar];
      }) || 0;
      var widthScale = d3.scaleLinear().domain([0, maxValue > 0 ? maxValue : 1]).range([0, width * 0.95]);
      var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeTableau10);
      var stageHeight = layer.data.length > 0 ? height / layer.data.length : 0;
      var stages;
      var root;
      var stageGroups;
      stages = layer.data.map(function(d, index) {
        var nextDatum = layer.data[index + 1] || null;
        var topWidth = widthScale(+d[valueVar] || 0);
        var bottomWidth = nextDatum ? widthScale(+nextDatum[valueVar] || 0) : topWidth * 0.55;
        var y0 = index * stageHeight;
        var y1 = Math.max(y0, y0 + stageHeight - stageGap);
        var centerX = width / 2;
        var topLeft = centerX - topWidth / 2;
        var topRight = centerX + topWidth / 2;
        var bottomLeft = centerX - bottomWidth / 2;
        var bottomRight = centerX + bottomWidth / 2;
        return {
          stage: d[stageVar],
          value: +d[valueVar],
          color: colorScale(d[stageVar]),
          datum: d,
          points: [
            [topLeft, y0],
            [topRight, y0],
            [bottomRight, y1],
            [bottomLeft, y1]
          ],
          labelX: centerX,
          labelY: (y0 + y1) / 2
        };
      });
      chart.derived.colorDiscrete = colorScale.domain(stages.map(function(stage) {
        return stage.stage;
      }));
      chart.colorDiscrete = chart.derived.colorDiscrete;
      root = chart.dom.chartArea.selectAll(".tag-funnel-" + layer.id).data([null]).join("g").attr("class", "tag-funnel-" + layer.id);
      stageGroups = root.selectAll(".funnel-stage-group").data(stages).join(function(enter) {
        var group = enter.append("g").attr("class", "funnel-stage-group");
        group.append("path").attr("class", "funnel-stage");
        group.append("text").attr("class", "funnel-label");
        return group;
      });
      stageGroups.select(".funnel-stage").attr("d", function(d) {
        return "M" + d.points[0][0] + "," + d.points[0][1] + "L" + d.points[1][0] + "," + d.points[1][1] + "L" + d.points[2][0] + "," + d.points[2][1] + "L" + d.points[3][0] + "," + d.points[3][1] + "Z";
      }).attr("fill", function(d) {
        return d.color;
      });
      stageGroups.select(".funnel-label").attr("x", function(d) {
        return d.labelX;
      }).attr("y", function(d) {
        return d.labelY;
      }).attr("dy", "0.35em").attr("text-anchor", "middle").text(function(d) {
        return d.stage;
      });
    }
    getHoverSelector(chart, layer) {
      return ".tag-funnel-" + layer.id + " .funnel-stage";
    }
    formatTooltip(chart, d) {
      return {
        title: { text: String(d.stage) },
        items: [{ color: d.color, label: String(d.stage), value: String(d.value) }]
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-funnel-" + layer.id).remove();
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/ParallelRenderer.js
  var ParallelRenderer = class {
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
      var width = (chart.width || chart.runtime && chart.runtime.width || 0) - margin.left - margin.right;
      var height = (chart.height || chart.runtime && chart.runtime.height || 0) - margin.top - margin.bottom;
      var rawDimensions = layer.mapping.dimensions;
      var dimensions = Array.isArray(rawDimensions) ? rawDimensions.slice() : [rawDimensions];
      var groupVar = layer.mapping.group;
      var xScale = d3.scalePoint().domain(dimensions).range([0, width]).padding(0.5);
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
        if (!extent || extent[0] === void 0 || extent[1] === void 0) {
          extent = [0, 1];
        }
        if (extent[0] === extent[1]) {
          extent = [extent[0] - 1, extent[1] + 1];
        }
        yScales[dimension] = d3.scaleLinear().domain(extent).range([height, 0]);
      });
      chart.derived.colorDiscrete = colorScale.domain(Array.from(new Set(layer.data.map(function(row) {
        return groupVar ? row[groupVar] : layer.label;
      }))));
      chart.colorDiscrete = chart.derived.colorDiscrete;
      root = chart.dom.chartArea.selectAll(".tag-parallel-" + layer.id).data([null]).join("g").attr("class", "tag-parallel-" + layer.id);
      axisGroups = root.selectAll(".parallel-axis").data(dimensions).join(function(enter) {
        var group = enter.append("g").attr("class", "parallel-axis");
        group.append("text").attr("class", "parallel-axis-label");
        return group;
      }).attr("transform", function(dimension) {
        return "translate(" + xScale(dimension) + ",0)";
      }).each(function(dimension) {
        d3.select(this).call(d3.axisLeft(yScales[dimension]).ticks(5));
      });
      axisGroups.select(".parallel-axis-label").attr("x", 0).attr("y", -10).attr("text-anchor", "middle").text(function(dimension) {
        return dimension;
      });
      lineGenerator = d3.line().defined(function(point) {
        return point && point[1] !== null;
      }).x(function(point) {
        return point[0];
      }).y(function(point) {
        return point[1];
      });
      root.selectAll(".parallel-line").data(layer.data).join("path").attr("class", "parallel-line").attr("d", function(row) {
        var points = dimensions.map(function(dimension) {
          var value = +row[dimension];
          if (!Number.isFinite(value)) {
            return [xScale(dimension), null];
          }
          return [xScale(dimension), yScales[dimension](value)];
        });
        return lineGenerator(points);
      }).attr("stroke", function(row) {
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
            color: chart.colorDiscrete ? chart.colorDiscrete(layer.mapping.group ? d[layer.mapping.group] : layer.label) : layer.color,
            label: dimension,
            value: String(d[dimension])
          };
        })
      };
    }
    remove(chart, layer) {
      chart.dom.chartArea.selectAll(".tag-parallel-" + layer.id).remove();
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
    if (!rendererRegistry.has(RangeBarRenderer.type)) {
      registerRenderer(RangeBarRenderer.type, new RangeBarRenderer());
    }
    if (!rendererRegistry.has(LollipopRenderer.type)) {
      registerRenderer(LollipopRenderer.type, new LollipopRenderer());
    }
    if (!rendererRegistry.has(DumbbellRenderer.type)) {
      registerRenderer(DumbbellRenderer.type, new DumbbellRenderer());
    }
    if (!rendererRegistry.has(WaffleRenderer.type)) {
      registerRenderer(WaffleRenderer.type, new WaffleRenderer());
    }
    if (!rendererRegistry.has(BeeswarmRenderer.type)) {
      registerRenderer(BeeswarmRenderer.type, new BeeswarmRenderer());
    }
    if (!rendererRegistry.has(BumpRenderer.type)) {
      registerRenderer(BumpRenderer.type, new BumpRenderer());
    }
    if (!rendererRegistry.has(RadarRenderer.type)) {
      registerRenderer(RadarRenderer.type, new RadarRenderer());
    }
    if (!rendererRegistry.has(FunnelRenderer.type)) {
      registerRenderer(FunnelRenderer.type, new FunnelRenderer());
    }
    if (!rendererRegistry.has(ParallelRenderer.type)) {
      registerRenderer(ParallelRenderer.type, new ParallelRenderer());
    }
    if (!rendererRegistry.has(TextRenderer.type)) {
      registerRenderer(TextRenderer.type, new TextRenderer());
    }
    if (!rendererRegistry.has(BracketRenderer.type)) {
      registerRenderer(BracketRenderer.type, new BracketRenderer());
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
    }).on("end", function(event, d) {
      d3.select(this).classed("active", false).style("cursor", "grab");
      chart.updateRegression(color, layer.label);
      chart.emit("dragEnd", { point: d, layerLabel: layer.label });
    });
    chart.chart.selectAll("." + tagName("point", chart.element.id, layer.label)).style("cursor", "grab").call(drag);
  }

  // inst/htmlwidgets/myIO/src/interactions/status-bar.js
  function showStatusBar(chart, message, actions) {
    removeStatusBar(chart);
    var container = d3.select(chart.dom.element);
    var bar = container.append("div").attr("class", "myIO-status-bar").attr("role", "status").attr("aria-live", "polite");
    bar.append("span").attr("class", "myIO-status-bar-text").text(message);
    var btnGroup = bar.append("span").attr("class", "myIO-status-bar-actions");
    (actions || []).forEach(function(action) {
      btnGroup.append("button").attr("class", "myIO-status-bar-btn").attr("type", "button").text(action.label).on("click", action.handler);
    });
  }
  function removeStatusBar(chart) {
    d3.select(chart.dom.element).selectAll(".myIO-status-bar").remove();
  }

  // inst/htmlwidgets/myIO/src/interactions/brush.js
  var BRUSHABLE_TYPES = ["point", "bar", "histogram", "hexbin", "groupedBar"];
  function bindBrush(chart) {
    var cfg = chart.config.interactions.brush;
    if (!cfg || !cfg.enabled) return;
    var brushableLayers = (chart.derived.currentLayers || []).filter(function(l) {
      return BRUSHABLE_TYPES.indexOf(l.type) > -1;
    });
    if (brushableLayers.length === 0) return;
    removeBrush(chart);
    var brushFn = cfg.direction === "x" ? d3.brushX() : cfg.direction === "y" ? d3.brushY() : d3.brush();
    var margin = chart.config.layout.margin;
    var chartWidth = chart.runtime.width - (margin.left + margin.right);
    var chartHeight = chart.runtime.height - (margin.top + margin.bottom);
    brushFn.extent([[0, 0], [chartWidth, chartHeight]]);
    brushFn.on("brush", function(event) {
      onBrush(chart, event, brushableLayers, cfg);
    }).on("end", function(event) {
      onBrushEnd(chart, event, brushableLayers, cfg);
    });
    chart.dom.chartArea.insert("g", ":first-child").attr("class", "myIO-brush").call(brushFn);
    chart.dom.chartArea.select(".myIO-brush .overlay").style("cursor", "crosshair");
    chart.runtime._brushFn = brushFn;
    d3.select(chart.dom.element).on("keydown.brush", function(event) {
      if (event.key === "Escape" && chart.runtime._brushed) {
        clearBrush(chart);
      }
    });
  }
  function onBrush(chart, event, layers, cfg) {
    if (!event.selection) return;
    var sel = event.selection;
    var dir = cfg.direction;
    layers.forEach(function(layer) {
      var selector = getLayerSelector(chart, layer);
      chart.dom.chartArea.selectAll(selector).each(function(d) {
        var inside = isInsideBrush(chart, d, layer, sel, dir);
        d3.select(this).style("opacity", inside ? 1 : "var(--chart-brush-dim-opacity)");
      });
    });
  }
  function onBrushEnd(chart, event, layers, cfg) {
    if (!event.selection) {
      clearBrush(chart);
      return;
    }
    var sel = event.selection;
    var dir = cfg.direction;
    var extent = invertExtent(chart, sel, dir);
    var selected = [];
    var keys = [];
    layers.forEach(function(layer) {
      layer.data.forEach(function(d) {
        if (isInsideBrush(chart, d, layer, sel, dir)) {
          selected.push(d);
          if (d._source_key) keys.push(d._source_key);
        }
      });
    });
    chart.runtime._brushed = { data: selected, extent, keys };
    var totalPoints = layers.reduce(function(sum, l) {
      return sum + l.data.length;
    }, 0);
    showStatusBar(
      chart,
      selected.length + " of " + totalPoints + " points selected",
      [{ label: "Clear", handler: function() {
        clearBrush(chart);
      } }]
    );
    chart.emit("brushed", {
      data: selected,
      extent,
      keys,
      layerLabel: layers.length === 1 ? layers[0].label : null
    });
  }
  function clearBrush(chart) {
    (chart.derived.currentLayers || []).forEach(function(layer) {
      if (BRUSHABLE_TYPES.indexOf(layer.type) > -1) {
        var selector = getLayerSelector(chart, layer);
        chart.dom.chartArea.selectAll(selector).style("opacity", 1);
      }
    });
    if (chart.runtime._brushFn) {
      chart.dom.chartArea.select(".myIO-brush").call(chart.runtime._brushFn.move, null);
    }
    chart.runtime._brushed = null;
    removeStatusBar(chart);
    chart.emit("brushed", { data: [], extent: null, keys: [], layerLabel: null });
  }
  function isInsideBrush(chart, d, layer, sel, dir) {
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var px = chart.xScale(d[xVar]);
    var py = chart.yScale(d[yVar]);
    if (isNaN(px) || isNaN(py)) return false;
    if (dir === "x") return px >= sel[0] && px <= sel[1];
    if (dir === "y") return py >= sel[0] && py <= sel[1];
    return px >= sel[0][0] && px <= sel[1][0] && py >= sel[0][1] && py <= sel[1][1];
  }
  function safeInvert(scale, v0, v1) {
    if (typeof scale.invert === "function") {
      return [scale.invert(v0), scale.invert(v1)];
    }
    return null;
  }
  function invertExtent(chart, sel, dir) {
    if (dir === "x") {
      return {
        x: safeInvert(chart.xScale, sel[0], sel[1]),
        y: null
      };
    }
    if (dir === "y") {
      return {
        x: null,
        y: safeInvert(chart.yScale, sel[1], sel[0])
      };
    }
    return {
      x: safeInvert(chart.xScale, sel[0][0], sel[1][0]),
      y: safeInvert(chart.yScale, sel[1][1], sel[0][1])
    };
  }
  function getLayerSelector(chart, layer) {
    if (layer.type === "groupedBar") return ".tag-grouped-bar-g rect";
    return "." + tagName(layer.type, chart.dom.element.id, layer.label);
  }
  function removeBrush(chart) {
    if (chart.dom && chart.dom.chartArea) {
      chart.dom.chartArea.selectAll(".myIO-brush").remove();
    }
    if (chart.dom && chart.dom.element) {
      d3.select(chart.dom.element).on("keydown.brush", null);
    }
    chart.runtime._brushed = null;
  }

  // inst/htmlwidgets/myIO/src/interactions/popover.js
  var MAX_LABEL_LENGTH = 30;
  function showPopover(chart, anchorPoint, options) {
    removePopover(chart);
    var container = d3.select(chart.dom.element);
    var popover = container.append("div").attr("class", "myIO-popover").attr("role", "dialog").attr("aria-label", "Annotate data point");
    var labelSection = popover.append("div").attr("class", "myIO-popover-field");
    labelSection.append("label").text("Label:");
    var inputEl;
    if (options.presetLabels && options.presetLabels.length > 0) {
      inputEl = labelSection.append("select").attr("class", "myIO-popover-input");
      options.presetLabels.forEach(function(label) {
        inputEl.append("option").attr("value", label).text(label);
      });
      if (options.existingLabel) inputEl.property("value", options.existingLabel);
    } else {
      inputEl = labelSection.append("input").attr("class", "myIO-popover-input").attr("type", "text").attr("maxlength", MAX_LABEL_LENGTH).attr("placeholder", "Enter label...");
      if (options.existingLabel) inputEl.property("value", options.existingLabel);
    }
    var selectedColor = null;
    if (options.categoryColors) {
      var colorSection = popover.append("div").attr("class", "myIO-popover-field");
      colorSection.append("label").text("Category:");
      var colorPicker = colorSection.append("div").attr("class", "myIO-popover-colors");
      Object.keys(options.categoryColors).forEach(function(name) {
        var color = options.categoryColors[name];
        colorPicker.append("button").attr("class", "myIO-popover-color-btn").attr("type", "button").attr("title", name).attr("aria-label", name).style("background-color", color).on("click", function() {
          colorPicker.selectAll(".myIO-popover-color-btn").classed("selected", false);
          d3.select(this).classed("selected", true);
          selectedColor = color;
        });
      });
    }
    var btnRow = popover.append("div").attr("class", "myIO-popover-buttons");
    if (options.existingLabel && options.onRemove) {
      btnRow.append("button").attr("class", "myIO-popover-btn myIO-popover-btn--danger").attr("type", "button").text("Remove").on("click", function() {
        removePopover(chart);
        options.onRemove();
      });
    }
    btnRow.append("button").attr("class", "myIO-popover-btn").attr("type", "button").text("Cancel").on("click", function() {
      removePopover(chart);
      if (options.onCancel) options.onCancel();
    });
    btnRow.append("button").attr("class", "myIO-popover-btn myIO-popover-btn--primary").attr("type", "button").text("Apply").on("click", function() {
      var val = inputEl.property("value").trim().substring(0, MAX_LABEL_LENGTH);
      if (val) {
        removePopover(chart);
        options.onApply(val, selectedColor);
      }
    });
    positionPopover(chart, popover, anchorPoint);
    inputEl.node().focus();
    popover.on("keydown", function(event) {
      if (event.key === "Enter") {
        var val = inputEl.property("value").trim().substring(0, MAX_LABEL_LENGTH);
        if (val) {
          removePopover(chart);
          options.onApply(val, selectedColor);
        }
      }
      if (event.key === "Escape") {
        removePopover(chart);
        if (options.onCancel) options.onCancel();
      }
    });
  }
  function positionPopover(chart, popover, point) {
    var margin = chart.config.layout.margin;
    var x = point.px + margin.left;
    var y = point.py + margin.top - 10;
    popover.style("left", Math.max(4, Math.min(x - 80, chart.runtime.totalWidth - 180)) + "px").style("bottom", chart.runtime.height - y + 8 + "px");
  }
  function removePopover(chart) {
    d3.select(chart.dom.element).selectAll(".myIO-popover").remove();
  }

  // inst/htmlwidgets/myIO/src/interactions/annotate.js
  var ANNOTATABLE_TYPES = ["point", "bar", "histogram", "hexbin", "groupedBar"];
  function bindAnnotation(chart) {
    var cfg = chart.config.interactions.annotation;
    if (!cfg || !cfg.enabled) return;
    if (!chart.runtime._annotations) chart.runtime._annotations = [];
    var layers = (chart.derived.currentLayers || []).filter(function(l) {
      return ANNOTATABLE_TYPES.indexOf(l.type) > -1;
    });
    layers.forEach(function(layer) {
      var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
      chart.dom.chartArea.selectAll(selector).on("click.annotate", function(event, d) {
        event.stopPropagation();
        var existing = findAnnotation(chart, d._source_key);
        showPopover(chart, {
          px: chart.xScale(d[layer.mapping.x_var]),
          py: chart.yScale(d[layer.mapping.y_var])
        }, {
          presetLabels: cfg.presetLabels,
          categoryColors: cfg.categoryColors,
          existingLabel: existing ? existing.label : null,
          onApply: function(label, color) {
            addAnnotation(chart, d, layer, label, color);
          },
          onRemove: function() {
            removeAnnotation(chart, d._source_key);
          },
          onCancel: function() {
          }
        });
      });
    });
    renderAnnotationMarks(chart);
    updateAnnotationStatus(chart);
  }
  function addAnnotation(chart, datum, layer, label, color) {
    chart.runtime._annotations = chart.runtime._annotations.filter(function(a) {
      return a._source_key !== datum._source_key;
    });
    var annotation = {
      _source_key: datum._source_key,
      x: datum[layer.mapping.x_var],
      y: datum[layer.mapping.y_var],
      x_var: layer.mapping.x_var,
      y_var: layer.mapping.y_var,
      label,
      category: color || null,
      layerLabel: layer.label,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    chart.runtime._annotations.push(annotation);
    renderAnnotationMarks(chart);
    updateAnnotationStatus(chart);
    chart.emit("annotated", {
      annotations: chart.runtime._annotations,
      action: "add",
      latest: annotation
    });
  }
  function removeAnnotation(chart, sourceKey) {
    var removed = chart.runtime._annotations.find(function(a) {
      return a._source_key === sourceKey;
    });
    chart.runtime._annotations = chart.runtime._annotations.filter(function(a) {
      return a._source_key !== sourceKey;
    });
    renderAnnotationMarks(chart);
    updateAnnotationStatus(chart);
    chart.emit("annotated", {
      annotations: chart.runtime._annotations,
      action: "remove",
      latest: removed || null
    });
  }
  function clearAnnotations(chart) {
    chart.runtime._annotations = [];
    renderAnnotationMarks(chart);
    removeStatusBar(chart);
    chart.emit("annotated", { annotations: [], action: "clear", latest: null });
  }
  function renderAnnotationMarks(chart) {
    var group = chart.dom.chartArea.selectAll(".myIO-annotations").data([0]);
    group = group.enter().append("g").attr("class", "myIO-annotations").merge(group);
    var marks = group.selectAll(".myIO-annotation-mark").data(chart.runtime._annotations || [], function(d) {
      return d._source_key;
    });
    marks.exit().remove();
    var enter = marks.enter().append("g").attr("class", "myIO-annotation-mark");
    enter.append("circle").attr("r", 8).attr("fill", "none").attr("stroke-width", 2);
    enter.append("text").attr("dy", -12).attr("text-anchor", "middle").attr("class", "myIO-annotation-label");
    var merged = enter.merge(marks);
    merged.attr("transform", function(d) {
      return "translate(" + chart.xScale(d.x) + "," + chart.yScale(d.y) + ")";
    });
    merged.select("circle").style("stroke", function(d) {
      return d.category || "var(--chart-annotation-ring)";
    });
    merged.select("text").text(function(d) {
      return d.label.length > 30 ? d.label.substring(0, 27) + "\u2026" : d.label;
    }).style("font-size", "var(--chart-annotation-font-size)").style("fill", "var(--chart-text-color)");
  }
  function updateAnnotationStatus(chart) {
    var count = (chart.runtime._annotations || []).length;
    if (count === 0) {
      removeStatusBar(chart);
      return;
    }
    showStatusBar(chart, count + " annotation" + (count === 1 ? "" : "s"), [
      {
        label: "Export",
        handler: function() {
          var data = chart.runtime._annotations || [];
          if (data.length > 0) {
            exportToCsv(chart.dom.element.id + "_annotations.csv", data);
          }
        }
      },
      { label: "Clear", handler: function() {
        clearAnnotations(chart);
      } }
    ]);
  }
  function findAnnotation(chart, sourceKey) {
    return (chart.runtime._annotations || []).find(function(a) {
      return a._source_key === sourceKey;
    });
  }
  function removeAnnotationBindings(chart) {
    removePopover(chart);
  }

  // inst/htmlwidgets/myIO/src/interactions/linked.js
  var LINKABLE_TYPES = ["point", "bar", "histogram", "hexbin", "groupedBar"];
  function bindLinked(chart) {
    var cfg = chart.config.interactions.linked;
    if (!cfg || !cfg.enabled) return;
    if (typeof crosstalk === "undefined") return;
    cleanupLinked(chart);
    var sel = new crosstalk.SelectionHandle(cfg.group);
    var fil = cfg.filter ? new crosstalk.FilterHandle(cfg.group) : null;
    chart.runtime._crosstalkSel = sel;
    chart.runtime._crosstalkFil = fil;
    if (cfg.mode === "source" || cfg.mode === "both") {
      chart.runtime._linkedBrushHandler = function(e) {
        if (e.keys && e.keys.length > 0) {
          sel.set(e.keys);
        } else {
          sel.clear();
        }
      };
      chart.on("brushed", chart.runtime._linkedBrushHandler);
    }
    if (cfg.mode === "target" || cfg.mode === "both") {
      sel.on("change.myIO", function(e) {
        applySelection(chart, e.value);
      });
      if (fil) {
        fil.on("change.myIO", function(e) {
          applyFilter(chart, e.value);
        });
      }
    }
  }
  function applySelection(chart, selectedKeys) {
    var layers = (chart.derived.currentLayers || []).filter(function(l) {
      return LINKABLE_TYPES.indexOf(l.type) > -1;
    });
    layers.forEach(function(layer) {
      var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
      chart.dom.chartArea.selectAll(selector).each(function(d) {
        if (!selectedKeys) {
          d3.select(this).style("opacity", 1);
        } else {
          var inside = selectedKeys.indexOf(d._source_key) > -1;
          d3.select(this).style("opacity", inside ? 1 : "var(--chart-brush-dim-opacity)");
        }
      });
    });
  }
  function applyFilter(chart, filteredKeys) {
    var layers = (chart.derived.currentLayers || []).filter(function(l) {
      return LINKABLE_TYPES.indexOf(l.type) > -1;
    });
    layers.forEach(function(layer) {
      var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
      chart.dom.chartArea.selectAll(selector).each(function(d) {
        if (!filteredKeys) {
          d3.select(this).style("display", null);
        } else {
          var visible = filteredKeys.indexOf(d._source_key) > -1;
          d3.select(this).style("display", visible ? null : "none");
        }
      });
    });
  }
  function cleanupLinked(chart) {
    if (chart.runtime._linkedBrushHandler) {
      chart.off("brushed", chart.runtime._linkedBrushHandler);
      chart.runtime._linkedBrushHandler = null;
    }
    if (chart.runtime._crosstalkSel) {
      chart.runtime._crosstalkSel.close();
      chart.runtime._crosstalkSel = null;
    }
    if (chart.runtime._crosstalkFil) {
      chart.runtime._crosstalkFil.close();
      chart.runtime._crosstalkFil = null;
    }
  }

  // inst/htmlwidgets/myIO/src/interactions/slider.js
  function bindSliders(chart) {
    var sliders = chart.config.interactions.sliders;
    if (!sliders || sliders.length === 0) return;
    removeSliders(chart);
    chart.runtime._sliderTimers = [];
    var container = d3.select(chart.dom.element);
    var wrapper = container.append("div").attr("class", "myIO-slider-wrapper");
    sliders.forEach(function(cfg) {
      var row = wrapper.append("div").attr("class", "myIO-slider-row");
      row.append("label").attr("class", "myIO-slider-label").attr("for", chart.dom.element.id + "-slider-" + cfg.param).text(cfg.label);
      var input = row.append("input").attr("type", "range").attr("class", "myIO-slider-input").attr("id", chart.dom.element.id + "-slider-" + cfg.param).attr("min", cfg.min).attr("max", cfg.max).attr("step", cfg.step || "any").attr("aria-label", cfg.label).attr("aria-valuemin", cfg.min).attr("aria-valuemax", cfg.max).attr("aria-valuenow", cfg.value).property("value", cfg.value);
      var valueSpan = row.append("span").attr("class", "myIO-slider-value").text(formatSliderValue(cfg.value, cfg.step));
      if (!HTMLWidgets.shinyMode) {
        input.attr("disabled", true).attr("title", "Parameter sliders require Shiny");
        row.style("opacity", "0.5");
        return;
      }
      var timerIdx = chart.runtime._sliderTimers.length;
      chart.runtime._sliderTimers.push(null);
      var debounceMs = cfg.debounce || 200;
      input.on("input", function() {
        var val = +this.value;
        valueSpan.text(formatSliderValue(val, cfg.step));
        d3.select(this).attr("aria-valuenow", val);
        clearTimeout(chart.runtime._sliderTimers[timerIdx]);
        chart.runtime._sliderTimers[timerIdx] = setTimeout(function() {
          Shiny.onInputChange(
            "myIO-" + chart.dom.element.id + "-slider-" + cfg.param,
            val
          );
          chart.emit("sliderChanged", { param: cfg.param, value: val });
        }, debounceMs);
      });
    });
  }
  function formatSliderValue(value, step) {
    if (step && step < 1) {
      var decimals = String(step).split(".")[1];
      return value.toFixed(decimals ? decimals.length : 2);
    }
    return String(value);
  }
  function removeSliders(chart) {
    if (chart.runtime._sliderTimers) {
      chart.runtime._sliderTimers.forEach(clearTimeout);
      chart.runtime._sliderTimers = null;
    }
    d3.select(chart.dom.element).selectAll(".myIO-slider-wrapper").remove();
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
        var yVar = that.newY ? that.newY : layer.mapping.y_var || layer.mapping.high_y;
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
          displayValue: v.density != null ? v.density : v[yVar],
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
          return { color: d.color, label: d.label, value: currentFormatY(d.displayValue) };
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
    var globalXExtentFields = scaleSemantics.xExtentFields || ["x_var"];
    var yExtentFields = scaleSemantics.yExtentFields || ["y_var"];
    var scaleLayers = lys.filter(function(layer) {
      var hints = layer.scaleHints;
      if (hints && Array.isArray(hints.xExtentFields) && hints.xExtentFields.length === 0 && Array.isArray(hints.yExtentFields) && hints.yExtentFields.length === 0) {
        return false;
      }
      return true;
    });
    scaleLayers.forEach(function(d) {
      var layerXFields = d.scaleHints && Array.isArray(d.scaleHints.xExtentFields) ? d.scaleHints.xExtentFields : globalXExtentFields;
      var xValues = [];
      layerXFields.forEach(function(field) {
        var dataField = d.mapping[field] || field;
        var values = d.data.map(function(e) {
          return +e[dataField];
        });
        xValues = xValues.concat(values);
      });
      var xLayerExtent = d3.extent(xValues.length > 0 ? xValues : [0]);
      var layerYFields = d.scaleHints && Array.isArray(d.scaleHints.yExtentFields) ? d.scaleHints.yExtentFields : yExtentFields;
      var yValues = [];
      layerYFields.forEach(function(field) {
        var dataField = d.mapping[field] || field;
        var values = d.data.map(function(e) {
          return +e[dataField];
        });
        yValues = yValues.concat(values);
      });
      var yExtent2 = d3.extent(yValues.length > 0 ? yValues : [0], function(e) {
        return e;
      });
      x_extents.push(xLayerExtent);
      y_extents.push([
        yExtent2[0],
        yExtent2[1]
      ]);
      var x_var = d.mapping.x_var;
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
    xExtentFields: ["x_var"],
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
    var xExtentFields = /* @__PURE__ */ new Set();
    var yExtentFields = /* @__PURE__ */ new Set();
    var domainMerge = "union";
    (layers || []).forEach(function(layer) {
      var hints = getScaleHintsForLayer(layer);
      var fallbackX = resolveFallbackScaleType(chart, "x");
      var fallbackY = resolveFallbackScaleType(chart, "y");
      var xType = fallbackX === "band" ? "band" : hints ? hints.xScaleType : fallbackX;
      var yType = fallbackY === "band" ? "band" : hints ? hints.yScaleType : fallbackY;
      var resolvedX = flipAxis ? yType : xType;
      var resolvedY = flipAxis ? xType : yType;
      xTypes.add(resolvedX);
      yTypes.add(resolvedY);
      var xFields = hints && Array.isArray(hints.xExtentFields) ? hints.xExtentFields : DEFAULT_SCALE_HINTS.xExtentFields;
      xFields.forEach(function(field) {
        xExtentFields.add(field);
      });
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
      xExtentFields: Array.from(xExtentFields).length > 0 ? Array.from(xExtentFields) : DEFAULT_SCALE_HINTS.xExtentFields,
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
      axesChart: traits.some(function(trait) {
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
    boxplot: "axes-categorical",
    violin: "axes-categorical",
    histogram: "axes-binned",
    heatmap: "axes-matrix",
    candlestick: "axes-continuous",
    waterfall: "axes-categorical",
    ridgeline: "axes-binned",
    rangeBar: "axes-continuous",
    sankey: "standalone-flow",
    hexbin: "axes-hex",
    treemap: "standalone-treemap",
    donut: "standalone-donut",
    gauge: "standalone-gauge",
    text: "axes-continuous",
    bracket: "axes-continuous",
    radar: "standalone-radar",
    funnel: "standalone-funnel",
    parallel: "standalone-parallel"
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
        console.warn("[myIO] Composition error:", message);
        chart.emit("error", { message });
      });
      return [];
    }
    return layers.filter(function(layer) {
      const renderer = getRendererForLayer(layer);
      const contract = renderer.constructor.dataContract;
      const result = validateAgainstContract(layer, contract);
      result.warnings.forEach(function(message) {
        console.warn("[myIO]", message);
      });
      if (result.errors.length > 0) {
        result.errors.forEach(function(message) {
          console.warn("[myIO] Layer '" + layer.label + "' removed:", message);
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

  // inst/htmlwidgets/myIO/src/theme/palettes.js
  var LIGHT = {
    "--chart-text-color": "#6b7280",
    "--chart-grid-color": "#9ca3af",
    "--chart-grid-opacity": "0.4",
    "--chart-bg": "#ffffff",
    "--chart-tooltip-bg": "#ffffff",
    "--chart-tooltip-border": "#e5e7eb",
    "--chart-tooltip-shadow": "0 4px 12px rgba(0, 0, 0, 0.12)",
    "--chart-button-color": "#6b7280",
    "--chart-button-hover-bg": "rgba(107, 114, 128, 0.1)",
    "--chart-sheet-bg": "#ffffff",
    "--chart-sheet-border": "rgba(17, 24, 39, 0.1)",
    "--chart-sheet-shadow": "0 20px 45px rgba(15, 23, 42, 0.18)",
    "--chart-sheet-backdrop": "rgba(15, 23, 42, 0.32)",
    "--chart-sheet-surface": "rgba(243, 244, 246, 0.9)",
    "--chart-sheet-accent": "#111827",
    "--chart-brush-fill": "rgba(0, 0, 0, 0.08)",
    "--chart-brush-stroke": "#6b7280",
    "--chart-status-bar-bg": "#f9fafb",
    "--chart-slider-track": "#e5e7eb",
    "--chart-ref-line-color": "#9ca3af",
    "--chart-annotation-ring": "#E63946"
  };
  var DARK = {
    "--chart-text-color": "#d1d5db",
    "--chart-grid-color": "#4b5563",
    "--chart-grid-opacity": "0.5",
    "--chart-bg": "#1e1e2e",
    "--chart-tooltip-bg": "#2d2d44",
    "--chart-tooltip-border": "#3f3f5c",
    "--chart-tooltip-shadow": "0 4px 12px rgba(0, 0, 0, 0.4)",
    "--chart-button-color": "#9ca3af",
    "--chart-button-hover-bg": "rgba(156, 163, 175, 0.15)",
    "--chart-sheet-bg": "#2d2d44",
    "--chart-sheet-border": "rgba(255, 255, 255, 0.1)",
    "--chart-sheet-shadow": "0 20px 45px rgba(0, 0, 0, 0.5)",
    "--chart-sheet-backdrop": "rgba(0, 0, 0, 0.6)",
    "--chart-sheet-surface": "rgba(45, 45, 68, 0.95)",
    "--chart-sheet-accent": "#f3f4f6",
    "--chart-brush-fill": "rgba(255, 255, 255, 0.08)",
    "--chart-brush-stroke": "#9ca3af",
    "--chart-status-bar-bg": "#252540",
    "--chart-slider-track": "#3f3f5c",
    "--chart-ref-line-color": "#4b5563",
    "--chart-annotation-ring": "#ff6b6b"
  };
  var PRESETS = {
    light: LIGHT,
    dark: DARK,
    midnight: { "--chart-bg": "#0f172a", "--chart-text-color": "#e2e8f0", "--chart-grid-color": "#334155", "--chart-grid-opacity": "0.5", "--chart-tooltip-bg": "#1e293b", "--chart-tooltip-border": "#475569", "--chart-button-color": "#94a3b8", "--chart-sheet-bg": "#1e293b", "--chart-annotation-ring": "#f472b6", "--chart-ref-line-color": "#475569", "--chart-status-bar-bg": "#1e293b", "--chart-slider-track": "#334155", "--chart-brush-fill": "rgba(255,255,255,0.06)", "--chart-brush-stroke": "#64748b" },
    ocean: { "--chart-bg": "#0c4a6e", "--chart-text-color": "#e0f2fe", "--chart-grid-color": "#0369a1", "--chart-grid-opacity": "0.4", "--chart-tooltip-bg": "#075985", "--chart-tooltip-border": "#0284c7", "--chart-button-color": "#7dd3fc", "--chart-sheet-bg": "#075985", "--chart-annotation-ring": "#fbbf24", "--chart-ref-line-color": "#0284c7", "--chart-status-bar-bg": "#0c4a6e", "--chart-slider-track": "#0369a1", "--chart-brush-fill": "rgba(255,255,255,0.08)", "--chart-brush-stroke": "#38bdf8" },
    forest: { "--chart-bg": "#14532d", "--chart-text-color": "#dcfce7", "--chart-grid-color": "#166534", "--chart-grid-opacity": "0.4", "--chart-tooltip-bg": "#15803d", "--chart-tooltip-border": "#22c55e", "--chart-button-color": "#86efac", "--chart-sheet-bg": "#15803d", "--chart-annotation-ring": "#fbbf24", "--chart-ref-line-color": "#22c55e", "--chart-status-bar-bg": "#14532d", "--chart-slider-track": "#166534", "--chart-brush-fill": "rgba(255,255,255,0.08)", "--chart-brush-stroke": "#4ade80" },
    sunset: { "--chart-bg": "#fef3c7", "--chart-text-color": "#78350f", "--chart-grid-color": "#d97706", "--chart-grid-opacity": "0.3", "--chart-tooltip-bg": "#fffbeb", "--chart-tooltip-border": "#f59e0b", "--chart-button-color": "#92400e", "--chart-sheet-bg": "#fffbeb", "--chart-annotation-ring": "#dc2626", "--chart-ref-line-color": "#d97706", "--chart-status-bar-bg": "#fef3c7", "--chart-slider-track": "#fde68a", "--chart-brush-fill": "rgba(0,0,0,0.06)", "--chart-brush-stroke": "#b45309" },
    monochrome: { "--chart-bg": "#fafafa", "--chart-text-color": "#404040", "--chart-grid-color": "#a3a3a3", "--chart-grid-opacity": "0.3", "--chart-tooltip-bg": "#ffffff", "--chart-tooltip-border": "#d4d4d4", "--chart-button-color": "#737373", "--chart-sheet-bg": "#ffffff", "--chart-annotation-ring": "#404040", "--chart-ref-line-color": "#a3a3a3", "--chart-status-bar-bg": "#f5f5f5", "--chart-slider-track": "#d4d4d4", "--chart-brush-fill": "rgba(0,0,0,0.06)", "--chart-brush-stroke": "#737373" },
    neon: { "--chart-bg": "#09090b", "--chart-text-color": "#a1a1aa", "--chart-grid-color": "#27272a", "--chart-grid-opacity": "0.5", "--chart-tooltip-bg": "#18181b", "--chart-tooltip-border": "#3f3f46", "--chart-button-color": "#a1a1aa", "--chart-sheet-bg": "#18181b", "--chart-annotation-ring": "#22d3ee", "--chart-ref-line-color": "#3f3f46", "--chart-status-bar-bg": "#09090b", "--chart-slider-track": "#27272a", "--chart-brush-fill": "rgba(34,211,238,0.08)", "--chart-brush-stroke": "#22d3ee" },
    corporate: { "--chart-bg": "#ffffff", "--chart-text-color": "#1e3a5f", "--chart-grid-color": "#bfdbfe", "--chart-grid-opacity": "0.5", "--chart-tooltip-bg": "#f0f9ff", "--chart-tooltip-border": "#93c5fd", "--chart-button-color": "#1e40af", "--chart-sheet-bg": "#f0f9ff", "--chart-annotation-ring": "#dc2626", "--chart-ref-line-color": "#93c5fd", "--chart-status-bar-bg": "#f0f9ff", "--chart-slider-track": "#bfdbfe", "--chart-brush-fill": "rgba(30,64,175,0.06)", "--chart-brush-stroke": "#3b82f6" },
    academic: { "--chart-bg": "#fffbf0", "--chart-text-color": "#1c1917", "--chart-grid-color": "#d6d3d1", "--chart-grid-opacity": "0.4", "--chart-tooltip-bg": "#fafaf9", "--chart-tooltip-border": "#a8a29e", "--chart-button-color": "#57534e", "--chart-sheet-bg": "#fafaf9", "--chart-annotation-ring": "#b91c1c", "--chart-ref-line-color": "#a8a29e", "--chart-status-bar-bg": "#fffbf0", "--chart-slider-track": "#d6d3d1", "--chart-brush-fill": "rgba(0,0,0,0.04)", "--chart-brush-stroke": "#78716c" },
    nature: { "--chart-bg": "#fefce8", "--chart-text-color": "#365314", "--chart-grid-color": "#a3e635", "--chart-grid-opacity": "0.3", "--chart-tooltip-bg": "#f7fee7", "--chart-tooltip-border": "#84cc16", "--chart-button-color": "#4d7c0f", "--chart-sheet-bg": "#f7fee7", "--chart-annotation-ring": "#ea580c", "--chart-ref-line-color": "#84cc16", "--chart-status-bar-bg": "#fefce8", "--chart-slider-track": "#d9f99d", "--chart-brush-fill": "rgba(0,0,0,0.04)", "--chart-brush-stroke": "#65a30d" },
    minimal: { "--chart-bg": "#ffffff", "--chart-text-color": "#71717a", "--chart-grid-color": "#e4e4e7", "--chart-grid-opacity": "0.5", "--chart-tooltip-bg": "#ffffff", "--chart-tooltip-border": "#f4f4f5", "--chart-button-color": "#a1a1aa", "--chart-sheet-bg": "#ffffff", "--chart-annotation-ring": "#ef4444", "--chart-ref-line-color": "#e4e4e7", "--chart-status-bar-bg": "#fafafa", "--chart-slider-track": "#e4e4e7", "--chart-brush-fill": "rgba(0,0,0,0.03)", "--chart-brush-stroke": "#d4d4d8" },
    retro: { "--chart-bg": "#fdf6e3", "--chart-text-color": "#586e75", "--chart-grid-color": "#93a1a1", "--chart-grid-opacity": "0.3", "--chart-tooltip-bg": "#eee8d5", "--chart-tooltip-border": "#93a1a1", "--chart-button-color": "#657b83", "--chart-sheet-bg": "#eee8d5", "--chart-annotation-ring": "#dc322f", "--chart-ref-line-color": "#93a1a1", "--chart-status-bar-bg": "#fdf6e3", "--chart-slider-track": "#eee8d5", "--chart-brush-fill": "rgba(0,0,0,0.04)", "--chart-brush-stroke": "#839496" },
    warm: { "--chart-bg": "#fff7ed", "--chart-text-color": "#7c2d12", "--chart-grid-color": "#fed7aa", "--chart-grid-opacity": "0.4", "--chart-tooltip-bg": "#fffbeb", "--chart-tooltip-border": "#fdba74", "--chart-button-color": "#c2410c", "--chart-sheet-bg": "#fffbeb", "--chart-annotation-ring": "#b91c1c", "--chart-ref-line-color": "#fdba74", "--chart-status-bar-bg": "#fff7ed", "--chart-slider-track": "#fed7aa", "--chart-brush-fill": "rgba(194,65,12,0.06)", "--chart-brush-stroke": "#ea580c" }
  };

  // inst/htmlwidgets/myIO/src/theme/theme-manager.js
  function normalizeThemeValues(values) {
    if (!values || typeof values !== "object") {
      return {};
    }
    var normalized = {};
    for (var key of Object.keys(values)) {
      var cssKey = key.startsWith("--") ? key : "--" + key;
      normalized[cssKey] = values[key];
    }
    return normalized;
  }
  function normalizeThemeConfig(raw) {
    if (!raw || typeof raw !== "object") {
      return { mode: null, preset: null, values: {} };
    }
    if (!("mode" in raw) && !("preset" in raw) && !("values" in raw)) {
      return { mode: null, preset: null, values: normalizeThemeValues(raw) };
    }
    return {
      mode: raw.mode || null,
      preset: raw.preset || null,
      values: normalizeThemeValues(raw.values || {})
    };
  }
  var ThemeManager = class {
    constructor(element, config) {
      this.element = element;
      this.config = normalizeThemeConfig(config ? config.theme : null);
      this.currentMode = null;
      this.mutationObserver = null;
      this.mediaQuery = null;
      this._mediaHandler = null;
      this.listeners = [];
    }
    initialize() {
      var resolved = this.resolveMode();
      this.apply(resolved);
      if (this.config.mode === "auto") {
        this.startListening();
      }
    }
    resolveMode() {
      var mode = this.config.mode;
      if (mode === "light" || mode === "dark") {
        return mode;
      }
      if (mode === "auto") {
        return this.detectEnvironment();
      }
      return "light";
    }
    detectEnvironment() {
      var bsTheme = this.element.closest && this.element.closest("[data-bs-theme]");
      if (bsTheme) {
        return bsTheme.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
      }
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    }
    apply(mode) {
      this.currentMode = mode;
      var palette = mode === "dark" ? DARK : LIGHT;
      if (this.config.preset && PRESETS[this.config.preset]) {
        palette = PRESETS[this.config.preset];
      }
      for (var prop of Object.keys(palette)) {
        this.element.style.setProperty(prop, palette[prop]);
      }
      if (this.config.values) {
        for (var key of Object.keys(this.config.values)) {
          this.element.style.setProperty(key, this.config.values[key]);
        }
      }
      this.element.dataset.theme = mode;
      for (var fn of this.listeners) {
        fn(mode);
      }
    }
    startListening() {
      var self2 = this;
      this.mutationObserver = new MutationObserver(function() {
        var newMode = self2.detectEnvironment();
        if (newMode !== self2.currentMode) {
          self2.apply(newMode);
        }
      });
      var body = document.body;
      if (body) {
        this.mutationObserver.observe(body, {
          attributes: true,
          attributeFilter: ["data-bs-theme"]
        });
      }
      if (window.matchMedia) {
        this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        this._mediaHandler = function() {
          var newMode = self2.detectEnvironment();
          if (newMode !== self2.currentMode) {
            self2.apply(newMode);
          }
        };
        if (typeof this.mediaQuery.addEventListener === "function") {
          this.mediaQuery.addEventListener("change", this._mediaHandler);
        } else if (typeof this.mediaQuery.addListener === "function") {
          this.mediaQuery.addListener(this._mediaHandler);
        }
      }
    }
    onChange(fn) {
      this.listeners.push(fn);
    }
    destroy() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
      if (this.mediaQuery && this._mediaHandler) {
        if (typeof this.mediaQuery.removeEventListener === "function") {
          this.mediaQuery.removeEventListener("change", this._mediaHandler);
        } else if (typeof this.mediaQuery.removeListener === "function") {
          this.mediaQuery.removeListener(this._mediaHandler);
        }
      }
      this.listeners = [];
    }
  };

  // inst/htmlwidgets/myIO/src/layout/facet-panel.js
  var FACET_PANEL_HEIGHT = 200;
  var FacetPanel = class {
    constructor(controller, facetValue, element, index, total) {
      this.controller = controller;
      this.facetValue = facetValue;
      this.element = element;
      this.index = index;
      this.total = total;
      this.layers = [];
      this.panelChart = null;
      this.suppressX = false;
      this.suppressY = false;
      if (!this.element.id) {
        this.element.id = controller.chart.dom.element.id + "-facet-panel-" + index;
      }
    }
    initialize(layers) {
      this.layers = layers || [];
      this.destroy();
      this.updateGridPosition();
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
    updateGridPosition() {
      var ncol = this.getColumnCount();
      var lastRow = Math.floor((this.total - 1) / ncol);
      var gridRow = Math.floor(this.index / ncol);
      var gridCol = this.index % ncol;
      this.suppressX = this.controller.config.scales === "fixed" && gridRow !== lastRow;
      this.suppressY = this.controller.config.scales === "fixed" && gridCol !== 0;
    }
    getColumnCount() {
      var configured = this.controller.config.ncol;
      if (configured) {
        return Math.max(configured, 1);
      }
      var container = this.controller.container && this.controller.container.node ? this.controller.container.node() : null;
      if (container && window.getComputedStyle) {
        var template = window.getComputedStyle(container).gridTemplateColumns || "";
        var parts = template.split(" ").filter(function(part) {
          return !!part && part !== "none";
        });
        if (parts.length > 0) {
          return parts.length;
        }
      }
      var containerWidth = container ? container.clientWidth : this.controller.chart.runtime.totalWidth;
      return Math.max(Math.floor(containerWidth / (this.controller.config.minWidth || 200)), 1);
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
      d3.select(this.element).append("div").attr("class", "myIO-facet-label").text(this.facetValue);
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
        this.applyAxisSuppression(panelChart);
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
        layers: this.layers
      });
      var options = {
        margin,
        suppressLegend: true,
        suppressAxis: { xAxis: this.suppressX, yAxis: this.suppressY },
        xlim: panelConfig.scales.xlim,
        ylim: panelConfig.scales.ylim,
        categoricalScale: panelConfig.scales.categoricalScale,
        flipAxis: panelConfig.scales.flipAxis,
        colorScheme: panelConfig.scales.colorScheme ? panelConfig.scales.colorScheme.enabled ? [panelConfig.scales.colorScheme.colors, panelConfig.scales.colorScheme.domain, "on"] : [panelConfig.scales.colorScheme.colors, panelConfig.scales.colorScheme.domain, "off"] : null,
        xAxisFormat: panelConfig.axes.xAxisFormat,
        yAxisFormat: panelConfig.axes.yAxisFormat,
        toolTipFormat: panelConfig.axes.toolTipFormat,
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
          width,
          height: FACET_PANEL_HEIGHT,
          layout: parentChart.runtime.layout,
          activeY: parentChart.runtime.activeY,
          activeYFormat: parentChart.runtime.activeYFormat
        },
        options,
        margin,
        width,
        height: FACET_PANEL_HEIGHT,
        totalWidth: width,
        layout: parentChart.runtime.layout,
        newY: parentChart.runtime.activeY,
        newScaleY: parentChart.runtime.activeYFormat,
        plotLayers: this.layers,
        emit: function() {
        },
        dragPoints: function() {
        },
        updateRegression: function() {
        },
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
        captureLegacyAliases: function() {
        }
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
      if (this.suppressX) {
        margin.bottom = Math.min(margin.bottom, 12);
      }
      if (this.suppressY) {
        margin.left = Math.min(margin.left, 12);
      }
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
      panelChart.dom.clipPath = panelChart.dom.chartArea.append("defs").append("svg:clipPath").attr("id", panelChart.dom.element.id + "clip").append("svg:rect").attr("x", 0).attr("y", 0).attr("width", panelChart.width - (panelChart.margin.left + panelChart.margin.right)).attr("height", chartHeight);
      panelChart.dom.chartArea.attr("clip-path", "url(#" + panelChart.dom.element.id + "clip)");
      panelChart.clipPath = panelChart.dom.clipPath;
    }
    applyAxisSuppression(panelChart) {
      if (this.suppressX) {
        panelChart.plot.selectAll(".x-axis").remove();
      }
      if (this.suppressY) {
        panelChart.plot.selectAll(".y-axis").remove();
      }
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
        svg: d3.select(this.element).append("svg").attr("class", "myIO-svg").attr("width", "100%").attr("height", FACET_PANEL_HEIGHT).attr("viewBox", "0 0 " + width + " " + FACET_PANEL_HEIGHT)
      };
      this.panelChart.svg.append("text").attr("x", width / 2).attr("y", FACET_PANEL_HEIGHT / 2).attr("text-anchor", "middle").attr("fill", "var(--chart-grid-color)").style("font-size", "11px").style("font-style", "italic").text("No data");
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
  };

  // inst/htmlwidgets/myIO/src/layout/facet-controller.js
  var FACET_PANEL_HEIGHT2 = 200;
  var FacetController = class {
    constructor(chart) {
      this.chart = chart;
      this.config = chart.config.facet || {};
      this.panels = /* @__PURE__ */ new Map();
      this.container = null;
      this.resizeObserver = null;
      this.validatedLayers = [];
      this.globalScaleSnapshot = null;
    }
    initialize() {
      this.destroy();
      this.config = this.chart.config.facet || {};
      this.validatedLayers = this.getValidatedLayers();
      if (this.chart.dom && this.chart.dom.svg) {
        this.chart.dom.svg.style("display", "none");
      }
      d3.select(this.chart.dom.element).selectAll(".myIO-fab, .myIO-panel, .myIO-sheet-backdrop").remove();
      if (this.validatedLayers.length === 0) {
        this.createGrid([]);
        return;
      }
      var facetValues = this.groupData();
      this.globalScaleSnapshot = this.config.scales === "fixed" ? this.captureGlobalScaleSnapshot(this.validatedLayers) : null;
      this.createGrid(facetValues);
      for (var i = 0; i < facetValues.length; i += 1) {
        var value = facetValues[i];
        var panelDiv = this.container.append("div").attr("class", "myIO-facet-panel").attr("data-facet-value", value);
        var panel = new FacetPanel(this, value, panelDiv.node(), i, facetValues.length);
        panel.initialize(this.filterLayersForValue(value));
        this.panels.set(value, panel);
      }
    }
    getValidatedLayers() {
      var previousLayers = this.chart.derived.currentLayers;
      this.chart.derived.currentLayers = this.chart.config.layers || [];
      var layers = validateLayers(this.chart);
      this.chart.derived.currentLayers = previousLayers;
      return layers;
    }
    groupData() {
      var facetVar = this.config.var;
      var valueSet = {};
      for (var i = 0; i < this.validatedLayers.length; i += 1) {
        var data = this.validatedLayers[i].data || [];
        for (var j = 0; j < data.length; j += 1) {
          var val = String(data[j][facetVar]);
          valueSet[val] = true;
        }
      }
      return Object.keys(valueSet).sort();
    }
    filterLayersForValue(value) {
      var facetVar = this.config.var;
      return this.validatedLayers.map(function(layer) {
        return Object.assign({}, layer, {
          data: (layer.data || []).filter(function(d) {
            return String(d[facetVar]) === value;
          })
        });
      });
    }
    createGrid(facetValues) {
      d3.select(this.chart.dom.element).select(".myIO-facet-grid").remove();
      this.container = d3.select(this.chart.dom.element).append("div").attr("class", "myIO-facet-grid").attr("role", "group").attr("aria-label", "Small multiples chart faceted by " + this.config.var);
      if (this.config.ncol) {
        this.container.style("grid-template-columns", "repeat(" + this.config.ncol + ", 1fr)");
      } else {
        this.container.style(
          "grid-template-columns",
          "repeat(auto-fill, minmax(" + (this.config.minWidth || 200) + "px, 1fr))"
        );
      }
      if (!facetValues.length) {
        this.container.append("div").attr("class", "myIO-facet-panel myIO-facet-empty").text("No data");
      }
    }
    captureGlobalScaleSnapshot(layers) {
      if (!layers || !layers.length) {
        return null;
      }
      var scaleChart = {
        config: this.chart.config,
        derived: { currentLayers: layers.slice() },
        margin: Object.assign({}, this.chart.config.layout.margin),
        width: Math.max(this.config.minWidth || 200, 1),
        height: FACET_PANEL_HEIGHT2,
        runtime: {
          totalWidth: Math.max(this.config.minWidth || 200, 1)
        },
        syncLegacyAliases: function() {
        }
      };
      var renderState = deriveChartRender(scaleChart);
      if (!renderState.axesChart) {
        return {
          renderState
        };
      }
      applyDerivedScales(scaleChart, renderState);
      return {
        renderState,
        xDomain: scaleChart.derived.xScale ? scaleChart.derived.xScale.domain().slice() : null,
        yDomain: scaleChart.derived.yScale ? scaleChart.derived.yScale.domain().slice() : null,
        xBanded: scaleChart.derived.xBanded ? scaleChart.derived.xBanded.slice() : null,
        yBanded: scaleChart.derived.yBanded ? scaleChart.derived.yBanded.slice() : null,
        xCheck: scaleChart.derived.xCheck,
        colorDiscrete: scaleChart.derived.colorDiscrete || null,
        colorContinuous: scaleChart.derived.colorContinuous || null
      };
    }
    resize() {
      var width = this.chart.dom && this.chart.dom.element ? this.chart.dom.element.clientWidth : 0;
      if (this.chart.runtime) {
        this.chart.runtime.totalWidth = Math.max(width || this.chart.runtime.totalWidth || 0, 1);
        this.chart.runtime.width = this.chart.runtime.totalWidth;
      }
      if (this.config.scales === "fixed") {
        this.globalScaleSnapshot = this.captureGlobalScaleSnapshot(this.validatedLayers);
      }
      for (var panel of this.panels.values()) {
        panel.resize();
      }
    }
    destroy() {
      for (var panel of this.panels.values()) {
        panel.destroy();
      }
      this.panels.clear();
      d3.select(this.chart.dom.element).select(".myIO-facet-grid").remove();
      this.container = null;
      this.globalScaleSnapshot = null;
      if (this.chart.dom && this.chart.dom.svg) {
        this.chart.dom.svg.style("display", null);
      }
    }
  };

  // inst/htmlwidgets/myIO/src/a11y/descriptions.js
  function generateChartLabel(config) {
    var types = [];
    var layers = config && config.layers || [];
    for (var i = 0; i < layers.length; i++) {
      var type = layers[i].type;
      if (type && types.indexOf(type) === -1) {
        types.push(type);
      }
    }
    var xLabel = config && config.axes && config.axes.xAxisLabel || "x";
    var yLabel = config && config.axes && config.axes.yAxisLabel || "y";
    var prefix = types.length ? types.join(" and ") + " chart" : "chart";
    return prefix + ": " + xLabel + " vs " + yLabel;
  }
  function generateLayerLabel(layer) {
    var label = layer && (layer.label || layer.type) || "series";
    var dataLength = layer && Array.isArray(layer.data) ? layer.data.length : 0;
    return label + ": " + dataLength + " data points";
  }
  function generatePointLabel(d, layer) {
    var mapping = layer && layer.mapping || {};
    if (mapping.x_var && mapping.y_var && d) {
      return String(d[mapping.x_var] != null ? d[mapping.x_var] : "") + ": " + String(d[mapping.y_var] != null ? d[mapping.y_var] : "");
    }
    if (mapping.category && mapping.value && d) {
      return String(d[mapping.category] || "") + ": " + String(d[mapping.value] || "");
    }
    return "Data point";
  }

  // inst/htmlwidgets/myIO/src/a11y/aria.js
  function sanitizeLabel(label) {
    return String(label).replace(/[^a-zA-Z0-9_-]/g, "");
  }
  function getLayerGroup(chart, layer) {
    if (!chart.dom || !chart.dom.chartArea || !layer) {
      return null;
    }
    var chartArea = chart.dom.chartArea;
    var selectors = [
      ".tag-" + layer.type + "-" + layer.id,
      ".tag-" + layer.type + "-" + chart.dom.element.id + "-" + sanitizeLabel(layer.label)
    ];
    for (var i = 0; i < selectors.length; i++) {
      var selection = chartArea.select(selectors[i]);
      if (!selection.empty()) {
        return selection;
      }
    }
    return null;
  }
  function getLayerElements(chart, layer) {
    if (!chart.dom || !chart.dom.chartArea || !layer) {
      return null;
    }
    var chartArea = chart.dom.chartArea;
    var label = sanitizeLabel(layer.label);
    var elementId = chart.dom.element.id;
    var selectors = [];
    if (layer.type === "line") {
      selectors.push(".tag-point-" + elementId + "-" + label);
    }
    if (layer.type === "groupedBar") {
      selectors.push(".tag-grouped-bar-g rect");
    }
    selectors.push(".tag-" + layer.type + "-" + elementId + "-" + label);
    selectors.push(".tag-" + layer.type + "-" + layer.id + " circle");
    selectors.push(".tag-" + layer.type + "-" + layer.id + " rect");
    selectors.push(".tag-" + layer.type + "-" + layer.id + " path");
    selectors.push(".tag-" + layer.type + "-" + layer.id + " line");
    for (var i = 0; i < selectors.length; i++) {
      var selection = chartArea.selectAll(selectors[i]);
      if (!selection.empty()) {
        return selection;
      }
    }
    return null;
  }
  function applyARIA(chart) {
    if (!chart || !chart.dom || !chart.dom.svg) {
      return;
    }
    var svg = chart.dom.svg;
    var layers = chart.config && chart.config.layers ? chart.config.layers : [];
    svg.attr("role", "graphics-document").attr("aria-roledescription", "chart").attr("aria-label", generateChartLabel(chart.config)).attr("tabindex", "0");
    if (chart.dom.chartArea) {
      chart.dom.chartArea.attr("role", "graphics-object").attr("aria-roledescription", "plot area").attr("aria-label", "Plot area with " + layers.length + " data series");
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var layerGroup = getLayerGroup(chart, layer);
      var layerElements = getLayerElements(chart, layer);
      if (layerGroup && !layerGroup.empty()) {
        layerGroup.attr("role", "graphics-object").attr("aria-roledescription", layer.type + " series").attr("aria-label", generateLayerLabel(layer));
      }
      if (layerElements && !layerElements.empty()) {
        layerElements.each(function(d) {
          d3.select(this).attr("role", "graphics-symbol").attr("aria-roledescription", "data point").attr("aria-label", generatePointLabel(d, layer));
        });
      }
    }
  }

  // inst/htmlwidgets/myIO/src/a11y/keyboard-nav.js
  function sanitizeLabel2(label) {
    return String(label).replace(/[^a-zA-Z0-9_-]/g, "");
  }
  function getLayerSymbols(chart, layer) {
    if (!chart || !chart.dom || !chart.dom.chartArea || !layer) {
      return d3.select(null);
    }
    var chartArea = chart.dom.chartArea;
    var label = sanitizeLabel2(layer.label);
    var elementId = chart.dom.element.id;
    var selectors = [
      ".tag-" + layer.type + "-" + layer.id + ' [role="graphics-symbol"]'
    ];
    if (layer.type === "line") {
      selectors.push(".tag-point-" + elementId + "-" + label + '[role="graphics-symbol"]');
    }
    if (layer.type === "groupedBar") {
      selectors.push('.tag-grouped-bar-g rect[role="graphics-symbol"]');
    }
    selectors.push(".tag-" + layer.type + "-" + elementId + "-" + label + '[role="graphics-symbol"]');
    selectors.push(".tag-" + layer.type + "-" + layer.id + ' circle[role="graphics-symbol"]');
    selectors.push(".tag-" + layer.type + "-" + layer.id + ' rect[role="graphics-symbol"]');
    selectors.push(".tag-" + layer.type + "-" + layer.id + ' path[role="graphics-symbol"]');
    selectors.push(".tag-" + layer.type + "-" + layer.id + ' line[role="graphics-symbol"]');
    for (var i = 0; i < selectors.length; i++) {
      var selection = chartArea.selectAll(selectors[i]);
      if (!selection.empty()) {
        return selection;
      }
    }
    return d3.select(null);
  }
  var KeyboardNavigator = class {
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
      var self2 = this;
      this.liveRegion = d3.select(this.chart.dom.element).append("div").attr("role", "status").attr("aria-live", "polite").attr("aria-atomic", "true").attr("class", "myIO-sr-only");
      this._keyHandler = function(event) {
        self2.handleKey(event);
      };
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
      this.chart.dom.chartArea.selectAll(".myIO-kb-focus").classed("myIO-kb-focus", false);
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
      var self2 = this;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(function() {
        if (self2.liveRegion) {
          self2.liveRegion.text(text);
        }
      }, 150);
    }
    reset() {
      this.state = "IDLE";
      this.chart.dom.chartArea.selectAll(".myIO-kb-focus").classed("myIO-kb-focus", false);
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
  };

  // inst/htmlwidgets/myIO/src/a11y/data-table.js
  var DataTableFallback = class {
    constructor(chart) {
      this.chart = chart;
      this.tableContainer = null;
      this.visible = false;
    }
    initialize() {
      this.tableContainer = d3.select(this.chart.dom.element).append("div").attr("class", "myIO-data-table myIO-sr-only").attr("role", "region").attr("aria-label", "Chart data table");
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
        var table = this.tableContainer.append("table").attr("aria-label", "Data for " + (layer.label || layer.type));
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
          this.tableContainer.append("p").text("Showing first " + maxRows + " of " + data.length + " rows");
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
  };

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
      if (this.config.sparkline) {
        this.applySparklineOverrides();
      }
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
      this.themeManager = new ThemeManager(this.dom.element, this.config);
      this.themeManager.initialize();
      initializeTooltip(this);
      if (!this.config.sparkline) {
        this.keyboardNav = new KeyboardNavigator(this);
        this.keyboardNav.initialize();
        this.dataTable = new DataTableFallback(this);
        this.dataTable.initialize();
        applyARIA(this);
      }
      this.captureLegacyAliases();
      if (this.derived.currentLayers.length > 0) {
        this.setClipPath(this.derived.currentLayers[0].type);
      }
      this.renderCurrentLayers({ isInitialRender: true });
    }
    applySparklineOverrides() {
      this.config.layout.margin = { top: 1, right: 1, bottom: 1, left: 1 };
      this.config.layout.suppressLegend = true;
      this.config.layout.suppressAxis = { xAxis: true, yAxis: true };
      if (this.config.interactions.brush) this.config.interactions.brush.enabled = false;
      if (this.config.interactions.annotation) this.config.interactions.annotation.enabled = false;
      if (this.config.interactions.linked) this.config.interactions.linked.enabled = false;
      this.config.interactions.sliders = [];
      this.config.interactions.dragPoints = false;
      this.config.referenceLines = { x: null, y: null };
      this.dom.element.dataset.sparkline = "true";
    }
    renderCurrentLayers(opts) {
      const options = opts || {};
      const generation = ++this.runtime.renderGen;
      const isCurrent = () => this.runtime && this.runtime.renderGen === generation;
      if (this.config.facet && this.config.facet.enabled) {
        if (!this.facetController) {
          this.facetController = new FacetController(this);
        }
        this.facetController.initialize();
        return;
      } else if (this.facetController) {
        this.facetController.destroy();
        this.facetController = null;
      }
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
          if (!this.config.sparkline) {
            applyARIA(this);
          }
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
        removeBrush(this);
        if (this.config.interactions.brush && this.config.interactions.brush.enabled) {
          bindBrush(this);
        }
        if (this.config.interactions.annotation && this.config.interactions.annotation.enabled) {
          bindAnnotation(this);
        }
        if (this.config.interactions.linked && this.config.interactions.linked.enabled) {
          bindLinked(this);
        }
        if (this.config.interactions.sliders && this.config.interactions.sliders.length > 0) {
          bindSliders(this);
        }
        this.emit("afterRender", { state });
        if (!this.config.sparkline) {
          applyARIA(this);
        }
      } catch (error) {
        console.warn("[myIO] Render error:", error.message);
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
          var opacity = layer.options && layer.options.opacity != null ? layer.options.opacity : 1;
          if (opacity < 1) {
            var safeName = String(layer.label).replace(/\s+/g, "");
            that.dom.chartArea.selectAll("[class*='tag-'][class*='-" + safeName + "']").style("opacity", opacity);
          }
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
      if (this.facetController) {
        this.facetController.destroy();
        this.facetController = null;
      }
      if (this.keyboardNav) this.keyboardNav.destroy();
      if (this.dataTable) this.dataTable.destroy();
      if (this.themeManager) {
        this.themeManager.destroy();
      }
      if (this.runtime && this.runtime._sheetOpen) {
        closePanel(this, { returnFocus: false });
      }
      clearTimeout(this.runtime && this.runtime._sheetCloseTimer);
      removeBrush(this);
      removeAnnotationBindings(this);
      cleanupLinked(this);
      removeSliders(this);
      if (this.dom && this.dom.element) {
        d3.select(this.dom.element).on("keydown.brush", null);
      }
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
