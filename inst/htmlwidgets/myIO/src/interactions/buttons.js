import { exportToCsv } from "../utils/export-csv.js";
import { getSVGString, svgString2Image } from "../utils/export-svg.js";
import { saveAs } from "../utils/file-saver.js";

export const BUTTON_LABELS = {
  image: "Export as PNG",
  chart: "Download CSV data",
  percent: "Toggle percent view",
  group2stack: "Toggle grouped/stacked layout"
};

export function addButtons(chart, layers) {
  d3.select(chart.element).select(".buttonDiv").remove();

  var buttonData = [
    { name: "image", html: iconCamera() },
    { name: "chart", html: iconFileDown() },
    { name: "percent", html: iconPercent() },
    { name: "group2stack", html: iconLayers() }
  ];

  var data2Use = chart.options.toggleY ? (chart.plotLayers[0].type === "groupedBar" ? buttonData : buttonData.slice(0, 3)) : buttonData.slice(0, 2);
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

export function iconFileDown() {
  return iconWrapper('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="m9 15 3 3 3-3"></path>');
}

export function iconPercent() {
  return iconWrapper('<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="17" r="2"></circle>');
}

export function iconLayers() {
  return iconWrapper('<rect x="4" y="5" width="14" height="4" rx="1"></rect><rect x="6" y="10" width="14" height="4" rx="1"></rect><rect x="8" y="15" width="14" height="4" rx="1"></rect>');
}
