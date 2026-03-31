import { exportToCsv } from "../utils/export-csv.js";
import { getSVGString, svgString2Image } from "../utils/export-svg.js";
import { injectExportLegend } from "../utils/export-legend.js";
import { saveAs } from "../utils/file-saver.js";
import { copyAsSVG, copyAsPNG } from "../utils/export-clipboard.js";

export const BUTTON_LABELS = {
  image: "Export as PNG",
  chart: "Download CSV data",
  percent: "Toggle percent view",
  group2stack: "Toggle grouped/stacked layout",
  clipboard: "Copy to clipboard"
};

export function addButtons(chart, layers) {
  d3.select(chart.element).select(".buttonDiv").remove();

  var buttonData = [
    { name: "image", html: iconCamera() },
    { name: "chart", html: iconFileDown() },
    { name: "percent", html: iconPercent() },
    { name: "group2stack", html: iconLayers() },
    { name: "clipboard", html: iconClipboard() }
  ];

  var clipboardBtn = buttonData[buttonData.length - 1]; // always include clipboard
  var coreBtns = chart.options.toggleY ? (chart.plotLayers[0].type === "groupedBar" ? buttonData.slice(0, 4) : buttonData.slice(0, 3)) : buttonData.slice(0, 2);
  var data2Use = coreBtns.concat([clipboardBtn]);
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

  if (name === "clipboard") {
    var clipBtn = d3.select(chart.element).select('.button[aria-label="Copy to clipboard"]');
    showCopyMenu(chart, clipBtn.node());
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

export function iconClipboard() {
  return iconWrapper(
    '<rect x="8" y="2" width="8" height="4" rx="1"></rect>' +
    '<path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1"></path>'
  );
}

function showCopyMenu(chart, buttonNode) {
  // Remove any existing menu
  d3.select(chart.element).select(".myIO-copy-menu").remove();

  var menu = d3.select(buttonNode.parentNode).append("div")
    .attr("class", "myIO-copy-menu")
    .style("position", "absolute");

  var items = [
    { label: "Copy as SVG", action: function() { copyAsSVG(chart).then(function(ok) { if (ok) showCopyFeedback(chart, buttonNode); }); } },
    { label: "Copy as PNG", action: function() { copyAsPNG(chart).then(function(ok) { if (ok) showCopyFeedback(chart, buttonNode); }); } }
  ];

  // Hide PNG option if ClipboardItem not available
  if (typeof ClipboardItem === "undefined") {
    items = items.slice(0, 1);
  }

  items.forEach(function(item, i) {
    menu.append("button")
      .attr("class", "myIO-copy-menu-item")
      .attr("role", "menuitem")
      .attr("tabindex", "0")
      .text(item.label)
      .on("click", function() {
        menu.remove();
        item.action();
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          menu.remove();
          item.action();
        } else if (event.key === "Escape") {
          menu.remove();
          buttonNode.focus();
        } else if (event.key === "ArrowDown" && i < items.length - 1) {
          event.preventDefault();
          menu.selectAll(".myIO-copy-menu-item").nodes()[i + 1].focus();
        } else if (event.key === "ArrowUp" && i > 0) {
          event.preventDefault();
          menu.selectAll(".myIO-copy-menu-item").nodes()[i - 1].focus();
        }
      });
  });

  // Focus first item
  menu.select(".myIO-copy-menu-item").node().focus();

  // Close on click outside
  setTimeout(function() {
    document.addEventListener("click", function handler(e) {
      if (!menu.node() || !menu.node().contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", handler);
      }
    });
  }, 0);

  // Close on Escape from the button itself
  d3.select(buttonNode).on("keydown.copymenu", function(event) {
    if (event.key === "Escape") {
      menu.remove();
      d3.select(buttonNode).on("keydown.copymenu", null);
    }
  });
}

function showCopyFeedback(chart, buttonNode) {
  var original = buttonNode.innerHTML;
  buttonNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  buttonNode.classList.add("myIO-btn-success");

  // Screen reader announcement
  var announce = d3.select(chart.element).select(".myIO-sr-announce");
  if (announce.empty()) {
    announce = d3.select(chart.element).append("div")
      .attr("class", "myIO-sr-announce")
      .attr("aria-live", "polite")
      .attr("role", "status");
  }
  announce.text("Chart copied to clipboard");

  setTimeout(function() {
    buttonNode.innerHTML = original;
    buttonNode.classList.remove("myIO-btn-success");
    announce.text("");
  }, 1500);
}
