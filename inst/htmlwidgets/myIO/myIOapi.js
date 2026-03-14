(() => {
  // inst/htmlwidgets/myIO/src/renderers/LineRenderer.js
  var LineRenderer = class {
    static type = "line";
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
      var linePath = chart.chart.selectAll(".tag-line-" + chart.element.id + "-" + key.replace(/\s+/g, "")).data([data]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("fill", "none").attr("clip-path", "url(#" + chart.element.id + "clip)").style("stroke", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      }).style("stroke-width", chart.totalWidth > 600 ? 3 : 1).style("opacity", 0).attr("class", "tag-line-" + chart.element.id + "-" + key.replace(/\s+/g, ""));
      linePath.merge(newLinePath).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).style("stroke-width", chart.totalWidth > 600 ? 3 : 1).style("stroke", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[0][layer.mapping.group]) : layer.color;
      }).attr("d", valueLine);
      this.renderPoints(chart, layer);
    }
    renderPoints(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var points = chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).data(layer.data);
      points.exit().transition().remove();
      points.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("r", chart.totalWidth > 600 ? 5 : 3).style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      }).attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });
      points.enter().append("circle").attr("r", chart.totalWidth > 600 ? 5 : 3).style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      }).style("opacity", 0).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      }).attr("class", "tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1);
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/PointRenderer.js
  var PointRenderer = class {
    static type = "point";
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      if (layer.mapping.low_y) {
        renderCrosshairsY(chart, layer);
      }
      if (layer.mapping.low_x) {
        renderCrosshairsX(chart, layer);
      }
      var points = chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).data(layer.data);
      points.exit().transition().remove();
      points.transition().ease(d3.easeQuad).duration(transitionSpeed).attr("r", chart.totalWidth > 600 ? 5 : 3).style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      }).attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });
      points.enter().append("circle").attr("r", chart.totalWidth > 600 ? 5 : 3).style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      }).style("opacity", 0).attr("clip-path", "url(#" + chart.element.id + "clip)").attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      }).attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      }).attr("class", "tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1);
      if (chart.options.dragPoints == true) {
        chart.dragPoints(layer);
        var color = chart.options.colorScheme[2] == "on" ? chart.colorScheme(layer.data[layer.mapping.group]) : layer.color;
        setTimeout(function() {
          chart.updateRegression(color, layer.label);
        }, transitionSpeed);
      }
    }
  };
  function renderCrosshairsX(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var crosshairsX = chart.chart.selectAll(".tag-crosshairX-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).data(layer.data);
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
    }).attr("class", "tag-crosshairX-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).transition().delay(transitionSpeed).duration(transitionSpeed).ease(d3.easeQuad).attr("x1", function(d) {
      return chart.xScale(d[layer.mapping.low_x]);
    }).attr("x2", function(d) {
      return chart.xScale(d[layer.mapping.high_x]);
    });
  }
  function renderCrosshairsY(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var crosshairsY = chart.chart.selectAll(".tag-crosshairY-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).data(layer.data);
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
    }).attr("class", "tag-crosshairY-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).transition().delay(transitionSpeed).ease(d3.easeQuad).duration(transitionSpeed).attr("y1", function(d) {
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
    renderFromPoints(chart, color, label) {
      var that = chart;
      var transitionSpeed = chart.options.transition.speed / 2;
      var valueLine = d3.line().x(function(d) {
        return chart.xScale(d.x_var);
      }).y(function(d) {
        return chart.yScale(d.y_est);
      });
      var points = [];
      chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + label.replace(/\s+/g, "")).each(function() {
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
      var linePath = chart.chart.selectAll(".tag-regression-line-" + chart.element.id + "-" + label.replace(/\s+/g, "")).data([finalPoints]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("class", "tag-regression-line-" + chart.element.id + "-" + label.replace(/\s+/g, "")).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", "none").style("stroke", color).style("stroke-width", 3).style("opacity", 0);
      linePath.merge(newLinePath).transition().ease(d3.easeQuad).duration(transitionSpeed).style("opacity", 1).style("stroke", color).attr("d", valueLine);
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/AreaRenderer.js
  var AreaRenderer = class {
    static type = "area";
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
      var linePath = chart.chart.selectAll(".tag-area-" + chart.element.id + "-" + key.replace(/\s+/g, "")).data([data]);
      linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();
      var newLinePath = linePath.enter().append("path").attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[0][layer.mapping.group]) : layer.color;
      }).style("opacity", 0).attr("class", "tag-area-" + chart.element.id + "-" + key.replace(/\s+/g, ""));
      linePath.merge(newLinePath).attr("clip-path", "url(#" + chart.element.id + "clip)").transition().ease(d3.easeQuad).duration(transitionSpeed).attr("d", valueArea).style("opacity", 0.4);
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/BarRenderer.js
  var BarRenderer = class {
    static type = "bar";
    render(chart, layer) {
      if (chart.options.flipAxis === true) {
        renderHorizontalBars(chart, layer);
        return;
      }
      renderVerticalBars(chart, layer);
    }
  };
  function renderVerticalBars(chart, layer) {
    var m = chart.margin;
    var data = layer.data;
    var key = layer.label;
    var barSize = layer.options.barSize == "small" ? 0.5 : 1;
    var bandwidth = chart.options.categoricalScale.xAxis == true ? (chart.width - (m.left + m.right)) / chart.x_banded.length : Math.min(100, (chart.width - (chart.margin.right + chart.margin.left)) / layer.data.length);
    var transitionSpeed = chart.options.transition.speed;
    var bars = chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).data(data);
    bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();
    var newBars = bars.enter().append("rect").attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
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
    var bars = chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).data(data);
    bars.exit().transition().duration(transitionSpeed).attr("width", 0).remove();
    var newBars = bars.enter().append("rect").attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
      return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
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

  // inst/htmlwidgets/myIO/src/renderers/groupedBarHelpers.js
  function transitionGrouped(chart, data, colors, bandwidth) {
    var m = chart.margin;
    var transitionSpeed = chart.options.transition.speed;
    var chartHeight = chart.options.suppressLegend == false ? chart.totalWidth > 600 ? chart.height : chart.height * 0.8 : chart.height;
    var yFormat = d3.format(chart.options.yAxisFormat);
    var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
    chart.svg.selectAll(".y-axis").transition().ease(d3.easeQuad).duration(transitionSpeed).call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left)))).selectAll("text").attr("dx", "-.25em");
    chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
    chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
    chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
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
    var m = chart.margin;
    var transitionSpeed = chart.options.transition.speed;
    var chartHeight = chart.options.suppressLegend == false ? chart.totalWidth > 600 ? chart.height : chart.height * 0.8 : chart.height;
    var yScale = d3.scaleLinear().range(chart.yScale.range());
    var yMax = getStackedMax(data);
    yScale.domain([0, yMax * 1.1]);
    var yFormat = d3.format(chart.options.yAxisFormat);
    var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
    chart.svg.selectAll(".y-axis").transition().ease(d3.easeQuad).duration(transitionSpeed).call(d3.axisLeft(yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left)))).selectAll("text").attr("dx", "-.25em");
    chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
    chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
    chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
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
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : colors[i];
      }).attr("class", "tag-grouped-bar-g");
      bars.merge(bars).style("fill", function(d, i) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : colors[i];
      }).call(function() {
        if (chart.layout === "grouped") {
          transitionGrouped(chart, data, colors, bandwidth);
        } else {
          transitionStacked(chart, data, colors, bandwidth);
        }
      });
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/HistogramRenderer.js
  var HistogramRenderer = class {
    static type = "histogram";
    render(chart, layer) {
      var data = layer.bins;
      var key = layer.label;
      var transitionSpeed = chart.options.transition.speed;
      var bars = chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).data(data);
      bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();
      var newBars = bars.enter().append("rect").attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, "")).attr("clip-path", "url(#" + chart.element.id + "clip)").style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
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
  };

  // inst/htmlwidgets/myIO/src/renderers/HexbinRenderer.js
  var HexbinRenderer = class {
    static type = "hexbin";
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
      var hexbin = d3.hexbin().radius(layer.mapping.radius * (Math.min(chart.width, chart.height) / 1e3)).extent([[x_extent[0], y_extent[0]], [x_extent[1], y_extent[1]]]);
      var binnedData = hexbin(points);
      chart.colorContinuous = d3.scaleSequential(d3.interpolateBuPu).domain([0, d3.max(binnedData, function(d) {
        return d.length;
      })]);
      var bins = chart.chart.attr("clip-path", "url(#" + chart.element.id + "clip)").selectAll(".tag-hexbin-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).data(binnedData);
      bins.exit().transition().duration(transitionSpeed).remove();
      var newbins = bins.enter().append("path").attr("class", "tag-hexbin-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).attr("d", hexbin.hexagon()).attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).attr("fill", "white");
      bins.merge(newbins).transition().ease(d3.easeQuad).duration(transitionSpeed).attr("d", hexbin.hexagon()).attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).attr("fill", function(d) {
        return chart.colorContinuous(d.length);
      });
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/TreemapRenderer.js
  var TreemapRenderer = class {
    static type = "treemap";
    render(chart, layer) {
      var m = chart.margin;
      var format = d3.format(",d");
      var key = layer.label;
      if (chart.options.colorScheme[2] == "on") {
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
      d3.treemap().tile(d3.treemapResquarify).size([chart.width - (m.left + m.right), (chart.totalWidth > 600 ? chart.height : chart.height * 0.8) - (m.top + m.bottom)]).round(true).paddingInner(1)(root);
      var cell = chart.chart.selectAll(".root").data(root.leaves());
      cell.exit().remove();
      var newCell = cell.enter().append("g").attr("class", "root").attr("transform", function(d) {
        return "translate(" + d.x0 + "," + d.y0 + ")";
      });
      newCell.append("rect").attr("class", "tag-tree-" + chart.element.id + "-" + key.replace(/\s+/g, "")).attr("id", function(d) {
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
      cell.selectAll("title").remove();
      cell.append("title").text(function(d) {
        return d.data[layer.mapping.level_1] + "  \n" + d.data[layer.mapping.level_2] + "  \n" + d.data[layer.mapping.x_var] + "  \n" + format(d.value);
      });
      chart.updateOrdinalColorLegend(layer);
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/DonutRenderer.js
  var DonutRenderer = class {
    static type = "donut";
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
      if (chart.options.colorScheme[2] == "on") {
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
  };

  // inst/htmlwidgets/myIO/src/renderers/GaugeRenderer.js
  var GaugeRenderer = class {
    static type = "gauge";
    render(chart, layer) {
      var transitionSpeed = chart.options.transition.speed;
      var tau = Math.PI;
      var radius = Math.max(Math.min(chart.width, chart.totalWidth > 600 ? chart.height : chart.height * 0.8) / 2, 30);
      var barWidth = 30;
      var value = layer.data[0].value[0];
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
      chart.chart.selectAll(".gauge-text").remove();
      chart.chart.append("g").append("text").attr("class", "gauge-text").text(percentFormat(data[0])).attr("text-anchor", "middle").attr("font-size", 20).attr("dy", "-0.45em");
    }
  };

  // inst/htmlwidgets/myIO/src/renderers/StatLineRenderer.js
  var StatLineRenderer = class extends LineRenderer {
    static type = "stat_line";
  };

  // inst/htmlwidgets/myIO/src/registry.js
  var rendererRegistry = /* @__PURE__ */ new Map();
  function registerRenderer(type, RendererClass) {
    if (rendererRegistry.has(type)) {
      throw new Error("Renderer already registered for type: " + type);
    }
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
    var color = chart.options.colorScheme[2] == "on" ? chart.colorScheme(layer.data[layer.mapping.group]) : layer.color;
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
    chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, "")).call(drag);
  }

  // inst/htmlwidgets/myIO/src/tooltip.js
  function initializeTooltip(chart) {
    chart.tooltip = d3.select(chart.element).append("div").attr("class", "toolTip");
    chart.toolTipTitle = chart.tooltip.append("div").attr("class", "toolTipTitle").style("background-color", "lightgray");
    chart.toolTipBody = chart.tooltip.append("div").attr("class", "toolTipBody");
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
      var labelKey = layer.label.replace(/\s+/g, "");
      if (layer.type === "bar") {
        chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + labelKey).on("mouseout", hoverTipHide).on("mouseover", hoverTip).on("mousemove", hoverTip);
      }
      if (layer.type === "histogram") {
        chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + labelKey).on("mouseout", hoverHistogramHide).on("mouseover", hoverHistogram).on("mousemove", hoverHistogram);
      }
      if (layer.type === "point") {
        chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + labelKey).on("mouseout", hoverTipHide).on("mouseover", hoverTip).on("mousemove", hoverTip);
      }
      if (layer.type === "hexbin") {
        chart.chart.selectAll(".tag-hexbin-" + chart.element.id + "-" + labelKey).on("mouseout", hoverHexHide).on("mouseover", hoverHex).on("mousemove", hoverHex);
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
      var color = that.options.colorScheme[2] == "on" ? that.colorScheme(groupData) : thisLayer[0].color;
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
      var color = that.options.colorScheme[2] == "on" ? that.colorScheme(groupData) : thisLayer.color;
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

  // inst/htmlwidgets/myIO/src/layout/scaffold.js
  function getChartHeight(chart) {
    if (chart.options.suppressLegend == false) {
      return chart.totalWidth > 600 ? chart.height : chart.height * 0.8;
    }
    return chart.height;
  }
  function initializeScaffold(chart) {
    chart.element.innerHTML = "";
    chart.svg = d3.select(chart.element).append("svg").attr("class", "myIO-svg").attr("id", "myIO-svg" + chart.element.id).attr("width", chart.totalWidth).attr("height", chart.height);
    applyPlotTransform(chart);
    chart.chart = chart.plot.append("g").attr("class", "myIO-chart-area");
    if (chart.options.suppressLegend == false) {
      chart.legendTranslate = chart.totalWidth > 600 ? "translate(" + chart.width + ",0)" : "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")";
      chart.legendArea = chart.svg.append("g").attr("class", "myIO-legend-area").attr("transform", chart.legendTranslate).style("height", chart.totalWidth > 600 ? chart.height : chart.height * 0.2).style("width", chart.totalWidth > 600 ? chart.totalWidth - chart.width : chart.totalWidth - chart.margin.left);
    }
  }
  function updateScaffoldLayout(chart) {
    chart.svg.attr("width", chart.totalWidth).attr("height", chart.height);
    applyPlotTransform(chart);
    if (chart.plotLayers[0] && chart.plotLayers[0].type !== "gauge" && chart.plotLayers[0].type !== "donut" && chart.clipPath) {
      chart.clipPath.attr("x", 0).attr("y", 0).attr("width", chart.width - (chart.margin.left + chart.margin.right)).attr("height", getChartHeight(chart) - (chart.margin.top + chart.margin.bottom));
    }
    if (chart.options.suppressLegend == false && chart.legendArea) {
      chart.legendTranslate = chart.totalWidth > 600 ? "translate(" + chart.width + ",0)" : "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")";
      chart.legendArea.attr("transform", chart.legendTranslate).style("height", chart.totalWidth > 600 ? chart.height : chart.height * 0.2).style("width", chart.totalWidth > 600 ? chart.totalWidth - chart.width : chart.totalWidth - chart.margin.left);
    }
  }
  function applyPlotTransform(chart) {
    var primaryType = chart.plotLayers[0] ? chart.plotLayers[0].type : null;
    switch (primaryType) {
      case "gauge":
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.width / 2 + "," + (chart.totalWidth > 600 ? chart.height * 0.8 : chart.height * 0.6) + ")").attr("class", "myIO-chart-offset");
        break;
      case "donut":
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.width / 2 + "," + (chart.totalWidth > 600 ? chart.height : chart.height * 0.8) / 2 + ")").attr("class", "myIO-chart-offset");
        break;
      default:
        chart.plot = chart.plot || chart.svg.append("g");
        chart.plot.attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")").style("width", chart.width - chart.margin.right).attr("class", "myIO-chart-offset");
    }
  }

  // inst/htmlwidgets/myIO/src/derive/scales.js
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
    chart.xScale = x;
    chart.yScale = d3.scaleLinear().domain([0, d3.max(lys, function(d) {
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
    chart.x_check = (x_check1 == 0 & x_check2 == 0) == 1;
    if (x_min == x_max) {
      x_min = x_min - 1;
      x_max = x_max + 1;
    }
    var x_buffer = Math.max(Math.abs(x_max - x_min) * 0.05, 0.5);
    var xExtent = [
      chart.options.xlim.min ? +chart.options.xlim.min : x_min - x_buffer,
      chart.options.xlim.max ? +chart.options.xlim.max : x_max + x_buffer
    ];
    chart.x_banded = [].concat.apply([], x_bands).map(function(d) {
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
    var y_buffer = Math.abs(y_max - y_min) * 0.15;
    var yExtent = [
      chart.options.ylim.min ? +chart.options.ylim.min : y_min - y_buffer,
      chart.options.ylim.max ? +chart.options.ylim.max : y_max + y_buffer
    ];
    chart.y_banded = [].concat.apply([], y_bands).map(function(d) {
      try {
        return d[0];
      } catch (err) {
        return void 0;
      }
    }).filter(onlyUnique);
    var chartHeight = getChartHeight(chart);
    switch (chart.options.categoricalScale.xAxis) {
      case true:
        chart.xScale = d3.scaleBand().range([0, chart.width - (m.left + m.right)]).domain(chart.options.flipAxis == true ? chart.y_banded : chart.x_banded);
        break;
      case false:
        chart.xScale = d3.scaleLinear().range([0, chart.width - (m.right + m.left)]).domain(chart.options.flipAxis == true ? yExtent : xExtent);
    }
    switch (chart.options.categoricalScale.yAxis) {
      case true:
        chart.yScale = d3.scaleBand().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.options.flipAxis == true ? chart.x_banded : chart.y_banded);
        break;
      case false:
        chart.yScale = d3.scaleLinear().range([chartHeight - (m.top + m.bottom), 0]).domain(chart.options.flipAxis == true ? xExtent : yExtent);
    }
    if (chart.options.colorScheme) {
      chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
    }
  }
  function onlyUnique(value, index, self2) {
    return self2.indexOf(value) === index;
  }

  // inst/htmlwidgets/myIO/src/derive/chart-render.js
  function getPrimaryType(chart) {
    return chart.currentLayers && chart.currentLayers[0] ? chart.currentLayers[0].type : null;
  }
  function isAxesChart(type) {
    return ["treemap", "gauge", "donut"].indexOf(type) === -1;
  }
  function usesHistogramBins(type) {
    return type === "histogram";
  }
  function usesContinuousLegend(type) {
    return type === "hexbin";
  }
  function usesOrdinalLegend(type) {
    return type === "treemap" || type === "donut";
  }
  function needsReferenceLines(type) {
    return ["bar", "groupedBar", "line", "point", "area", "stat_line"].indexOf(type) > -1;
  }
  function deriveChartRender(chart) {
    var layers = chart.currentLayers || [];
    var types = layers.map(function(layer) {
      return layer.type;
    });
    var primaryType = getPrimaryType(chart);
    return {
      type: primaryType,
      axesChart: types.every(isAxesChart),
      histogram: types.length > 0 && types.every(usesHistogramBins),
      continuousLegend: types.length > 0 && types.every(usesContinuousLegend),
      ordinalLegend: types.length === 1 && usesOrdinalLegend(primaryType),
      referenceLines: types.some(needsReferenceLines)
    };
  }
  function applyDerivedScales(chart, renderState) {
    if (!renderState.axesChart) {
      return;
    }
    if (renderState.histogram) {
      createBins(chart, chart.currentLayers);
    } else {
      processScales(chart, chart.currentLayers);
    }
  }

  // inst/htmlwidgets/myIO/src/layout/axes.js
  function syncAxes(chart, state, options) {
    if (!state.axesChart) {
      return;
    }
    if (options && options.isInitialRender) {
      addAxes(chart);
    } else {
      updateAxes(chart);
    }
  }
  function addAxes(chart) {
    var m = chart.margin;
    var chartHeight = getChartHeight(chart);
    var xFormat = chart.options.xAxisFormat === "yearMon" ? d3.format("s") : d3.format(chart.options.xAxisFormat);
    var yFormat = d3.format(chart.options.yAxisFormat);
    switch (chart.options.categoricalScale.xAxis) {
      case true:
        chart.plot.append("g").attr("class", "x-axis").attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale)).selectAll("text").attr("class", "x-label").attr("dx", "-.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
        break;
      case false:
        chart.plot.append("g").attr("class", "x-axis").attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chart.height - (m.top + m.bottom)))).selectAll("text").attr("class", "x-label").attr("dy", "1.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
    }
    chart.plot.selectAll(".x-axis").selectAll(".domain").attr("class", "x-axis-line");
    chart.plot.selectAll(".x-axis").selectAll(".tick line").attr("class", "x-grid");
    chart.plot.selectAll(".x-axis").selectAll("text").attr("class", "x-label");
    var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
    chart.plot.append("g").attr("class", "y-axis").call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left)))).selectAll("text").attr("class", "y-label").attr("dx", "-.25em");
    chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
    chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
    chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
  }
  function updateAxes(chart) {
    var m = chart.margin;
    var chartHeight = getChartHeight(chart);
    var transitionSpeed = chart.options.transition.speed;
    var xFormat = chart.options.xAxisFormat === "yearMon" ? d3.format("s") : d3.format(chart.options.xAxisFormat);
    var yFormat = d3.format(chart.options.yAxisFormat);
    switch (chart.options.categoricalScale.xAxis) {
      case true:
        chart.svg.selectAll(".x-axis").transition().ease(d3.easeQuad).duration(transitionSpeed).attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale)).selectAll("text").attr("dx", "-.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
        break;
      case false:
        chart.svg.selectAll(".x-axis").transition().ease(d3.easeQuad).duration(transitionSpeed).attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")").call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chartHeight - (m.top + m.bottom)))).selectAll("text").attr("dy", "1.25em").attr("text-anchor", chart.width < 550 ? "end" : "center").attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
    }
    chart.plot.selectAll(".x-axis").selectAll(".domain").attr("class", "x-axis-line");
    chart.plot.selectAll(".x-axis").selectAll(".tick line").attr("class", "x-grid");
    chart.plot.selectAll(".x-axis").selectAll("text").attr("class", "x-label");
    var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
    chart.svg.selectAll(".y-axis").transition().ease(d3.easeQuad).duration(transitionSpeed).call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left)))).selectAll("text").attr("dx", "-.25em");
    chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
    chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
    chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
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
    var itemWidth = chart.totalWidth > 600 ? 140 : 125;
    var itemHeight = chart.totalWidth > 600 ? 25 : 22;
    var n = chart.totalWidth > 600 ? 1 : Math.floor(chart.totalWidth / itemWidth);
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + (chart.totalWidth > 600 ? m.top : 0) + ")").style("width", chart.totalWidth > 600 ? chart.totalWidth - chart.width : chart.totalWidth - chart.margin.left).style("fill", "white").style("opacity", 0.75);
    chart.plotLayers.forEach(function(layer, i) {
      var legendElement = svg.append("g").attr("class", "legendElements").selectAll(".legendElement").data([layer.label]).enter().append("g").attr("class", "legendElement").attr("transform", function() {
        return "translate(" + i % n * itemWidth + "," + Math.floor(i / n) * itemHeight + ")";
      }).attr("text-anchor", "start").attr("font-size", chart.totalWidth > 600 ? 12 : 10).style("opacity", currentLayerIndex.indexOf(layer.label) > -1 ? 1 : 0.5).on("click", toggleLine);
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
    var itemWidth = chart.totalWidth > 600 ? 140 : 125;
    var itemHeight = chart.totalWidth > 600 ? 25 : 22;
    var n = chart.totalWidth > 600 ? 1 : Math.floor(chart.totalWidth / itemWidth);
    var colorKey = [];
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + (chart.totalWidth > 600 ? m.top : 0) + ")").style("width", chart.totalWidth > 600 ? chart.totalWidth - chart.width : chart.totalWidth - chart.margin.left).style("fill", "white").style("opacity", 0.75);
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
      }).attr("text-anchor", "start").attr("font-size", chart.totalWidth > 600 ? 12 : 10);
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
    svg.append("rect").attr("class", "legend-box").attr("transform", "translate(5," + (chart.totalWidth > 600 ? m.top : 0) + ")").style("width", chart.totalWidth > 600 ? chart.totalWidth - chart.width : chart.totalWidth - chart.margin.left).style("fill", "white").style("opacity", 0.75);
    if (chart.totalWidth > 600) {
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
  var myIOchart = class {
    constructor(opts) {
      this.element = opts.element;
      this.plotLayers = opts.plotLayers;
      this.options = opts.options;
      this.margin = this.options.margin;
      this.totalWidth = Math.max(opts.width, 280);
      this.width = this.totalWidth > 600 && this.options.suppressLegend == false ? this.totalWidth * 0.8 : this.totalWidth;
      this.height = opts.height;
      this.draw();
    }
    get opts() {
      return this.options;
    }
    set opts(x) {
      this.options = x;
    }
    draw() {
      initializeScaffold(this);
      this.initialize();
    }
    initialize() {
      this.currentLayers = this.plotLayers;
      this.addButtons(this.currentLayers);
      initializeTooltip(this);
      if (this.currentLayers.length > 0) {
        this.setClipPath(this.currentLayers[0].type);
      }
      this.renderCurrentLayers({ isInitialRender: true });
    }
    renderCurrentLayers(opts) {
      var options = opts || {};
      var state = deriveChartRender(this);
      applyDerivedScales(this, state);
      syncAxes(this, state, options);
      this.routeLayers(this.currentLayers);
      syncReferenceLines(this, state, options);
      syncLegend(this, state);
      bindRollover(this);
    }
    addButtons(lys) {
      addButtons(this, lys);
    }
    toggleVarY(newY) {
      this.newY = newY[0];
      this.newScaleY = newY[1];
      this.processScales(this.currentLayers);
      this.updateAxes();
      this.routeLayers(this.currentLayers);
      bindRollover(this, this.currentLayers);
      if (this.options.suppressLegend == false) this.updateLegend();
    }
    toggleGroupedLayout(lys) {
      var data = getGroupedDataObject(lys, this);
      var colors = lys.map(function(layer) {
        return layer.color;
      });
      var bandwidth = (this.width - (this.margin.right + this.margin.left)) / (data[0].length + 1) / colors.length;
      if (this.layout === "stacked") {
        transitionGrouped(this, data, colors, bandwidth);
        this.layout = "grouped";
      } else {
        transitionStacked(this, data, colors, bandwidth);
        this.layout = "stacked";
      }
    }
    setClipPath(type) {
      switch (type) {
        case "donut":
        case "gauge":
          break;
        default:
          if (this.options.suppressLegend == false) {
            var chartHeight = this.totalWidth > 600 ? this.height : this.height * 0.8;
          } else {
            var chartHeight = this.height;
          }
          this.clipPath = this.chart.append("defs").append("svg:clipPath").attr("id", this.element.id + "clip").append("svg:rect").attr("x", 0).attr("y", 0).attr("width", this.width - (this.margin.left + this.margin.right)).attr("height", chartHeight - (this.margin.top + this.margin.bottom));
          this.chart.attr("clip-path", "url(#" + this.element.id + "clip)");
      }
    }
    createBins(lys) {
      createBins(this, lys);
    }
    processScales(lys) {
      processScales(this, lys);
    }
    addAxes() {
      addAxes(this);
    }
    updateAxes() {
      updateAxes(this);
    }
    routeLayers(lys) {
      var that = this;
      this.layerIndex = this.plotLayers.map(function(d) {
        return d.label;
      });
      lys.forEach(function(d) {
        var renderer = getRendererForLayer(d);
        if (renderer && typeof renderer.render === "function") {
          renderer.render(that, d, lys);
        }
      });
    }
    removeLayers(lys) {
      var that = this;
      lys.forEach(function(d) {
        d3.selectAll(".tag-line-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-bar-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-point-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-regression-line-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-hexbin-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-area-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-crosshairY-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
        d3.selectAll(".tag-crosshairX-" + that.element.id + "-" + d.replace(/\s+/g, "")).transition().duration(500).style("opacity", 0).remove();
      });
    }
    dragPoints(ly) {
      bindPointDrag(this, ly);
    }
    updateRegression(color, label) {
      getRenderer("regression").renderFromPoints(this, color, label);
    }
    updateReferenceLines() {
      updateReferenceLines(this);
    }
    updateLegend() {
      updateLegend(this);
    }
    updateOrdinalColorLegend(ly) {
      updateOrdinalColorLegend(this, ly);
    }
    updateContinuousColorLegend() {
      updateContinuousColorLegend(this);
    }
    updateChart(x) {
      this.options = x.options;
      this.plotLayers = x.layers;
      this.currentLayers = this.plotLayers;
      var newLayers = x.layers.map((d) => d.label);
      var oldLayers = [];
      this.layerIndex.forEach(function(d) {
        var x2 = newLayers.indexOf(d);
        if (x2 < 0) {
          oldLayers.push(d);
        }
      });
      this.renderCurrentLayers();
      this.removeLayers(oldLayers);
    }
    resize(width, height) {
      this.totalWidth = Math.max(width, 280);
      this.width = this.totalWidth > 600 && this.options.suppressLegend == false ? this.totalWidth * 0.8 : this.totalWidth;
      this.height = height;
      updateScaffoldLayout(this);
      var buttons2Use = d3.select(this.element).select(".buttonDiv").selectAll(".button").data();
      d3.select(this.element).select(".buttonDiv").style("left", this.width - (40 + 40 * buttons2Use.length) + "px").style("top", "0px");
      this.renderCurrentLayers();
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
