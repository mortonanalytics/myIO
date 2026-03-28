import { exportToCsv } from "../utils/export-csv.js";
import { downloadSVG, getSVGString, svgString2Image } from "../utils/export-svg.js";
import { injectExportLegend } from "../utils/export-legend.js";
import { saveAs } from "../utils/file-saver.js";

export const BUTTON_LABELS = {
  image: "Export as PNG",
  svg: "Download as SVG",
  chart: "Download CSV data",
  percent: "Toggle percent view",
  group2stack: "Toggle grouped/stacked layout"
};

export function addButtons(chart, layers) {
  d3.select(chart.element).select(".buttonDiv").remove();

  var buttonData = [
    { name: "image", html: iconCamera() },
    { name: "svg", html: iconSVG() },
    { name: "chart", html: iconFileDown() },
    { name: "percent", html: iconPercent() },
    { name: "group2stack", html: iconLayers() }
  ];

  var data2Use = chart.options.toggleY ? (chart.plotLayers[0].type === "groupedBar" ? buttonData : buttonData.slice(0, 4)) : buttonData.slice(0, 3);
  var exportConfig = chart.config && chart.config.export;
  if (exportConfig) {
    data2Use = data2Use.filter(function(d) {
      if (d.name === "image") return exportConfig.png !== false;
      if (d.name === "svg") return exportConfig.svg === true;
      if (d.name === "chart") return exportConfig.csv !== false;
      return true;
    });
  } else {
    data2Use = data2Use.filter(function(d) {
      return d.name !== "svg";
    });
  }

  var buttonDiv = d3.select(chart.element).append("div")
    .attr("class", "buttonDiv")
    .style("display", chart.runtime.totalWidth < 400 ? "none" : "inline-flex")
    .style("right", chart.options.suppressLegend ? "0px" : "8px")
    .style("top", "0px");

  var buttons = buttonDiv.selectAll(".button")
    .data(data2Use)
    .enter()
    .append("div")
    .attr("class", "button")
    .attr("role", "button")
    .attr("tabindex", "0")
    .attr("aria-label", function(d) { return BUTTON_LABELS[d.name]; })
    .html(function(d) {
      return d.html;
    })
    .on("click", function(event, d) {
      handleAction(chart, layers, d.name);
    })
    .on("keydown", function(event, d) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleAction(chart, layers, d.name);
      }
    });

  buttons.append("span")
    .attr("class", "sr-only")
    .text(function(d) { return BUTTON_LABELS[d.name]; });
}

export function handleAction(chart, layers, name) {
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
    if (brushed && brushed.data.length > 0 &&
        chart.config.interactions.brush &&
        chart.config.interactions.brush.onSelect === "export") {
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
    var nextToggle = chart.runtime.activeY === chart.options.toggleY[0]
      ? [chart.plotLayers[0].mapping.y_var, chart.options.yAxisFormat]
      : chart.options.toggleY;
    chart.toggleVarY(nextToggle);
    return;
  }

  if (name === "group2stack") {
    chart.toggleGroupedLayout(layers);
  }
}

export function iconWrapper(paths) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">' + paths + "</svg>";
}

export function iconCamera() {
  return iconWrapper('<path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"></path><circle cx="12" cy="13" r="4"></circle>');
}

export function iconSVG() {
  return iconWrapper('<rect x="3" y="3" width="18" height="18" rx="2"></rect><text x="12" y="15" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-weight="bold">SVG</text>');
}

export function iconFileDown() {
  return iconWrapper('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="m9 15 3 3 3-3"></path>');
}

export function iconPercent() {
  return iconWrapper('<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="17" r="2"></circle>');
}

export function iconLayers() {
  return iconWrapper('<rect x="4" y="5" width="14" height="4" rx="1"></rect><rect x="6" y="10" width="14" height="4" rx="1"></rect><rect x="8" y="15" width="14" height="4" rx="1"></rect>');
}
