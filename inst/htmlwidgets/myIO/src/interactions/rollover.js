import { createHoverOverlay, hideTooltip, removeHoverOverlay, setTooltipContent, showTooltip } from "../tooltip.js";

export function bindRollover(chart, layers) {
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
      chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + labelKey)
        .on("mouseout", hoverTipHide)
        .on("mouseover", hoverTip)
        .on("mousemove", hoverTip);
    }

    if (layer.type === "histogram") {
      chart.chart.selectAll(".tag-bar-" + chart.element.id + "-" + labelKey)
        .on("mouseout", hoverHistogramHide)
        .on("mouseover", hoverHistogram)
        .on("mousemove", hoverHistogram);
    }

    if (layer.type === "point") {
      chart.chart.selectAll(".tag-point-" + chart.element.id + "-" + labelKey)
        .on("mouseout", hoverTipHide)
        .on("mouseover", hoverTip)
        .on("mousemove", hoverTip);
    }

    if (layer.type === "hexbin") {
      chart.chart.selectAll(".tag-hexbin-" + chart.element.id + "-" + labelKey)
        .on("mouseout", hoverHexHide)
        .on("mouseover", hoverHex)
        .on("mousemove", hoverHex);
    }
  });

  if (lys.some(function(layer) { return layer.type === "groupedBar"; })) {
    chart.chart.selectAll(".tag-grouped-bar-g rect")
      .on("mouseout", hoverGroupedBarHide)
      .on("mouseover", hoverGroupedBar)
      .on("mousemove", hoverGroupedBar);
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

      if (d0 == undefined | d1 == undefined) {
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
        x_var: x_var,
        y_var: y_var,
        toolTip_var: d.mapping.toolTip,
        values: v
      });
    });

    if (HTMLWidgets.shinyMode) {
      Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(tipText.map(function(d) {
        return d.values;
      })));
    }

    if (tipText[0] != undefined) {
      that.toolLine
        .style("stroke", "black")
        .style("stroke-dasharray", "1,1")
        .attr("x1", that.xScale(tipText[0].values[tipText[0].x_var]))
        .attr("x2", that.xScale(tipText[0].values[tipText[0].x_var]))
        .attr("y1", 0)
        .attr("y2", that.height - (that.margin.top + that.margin.bottom));

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
