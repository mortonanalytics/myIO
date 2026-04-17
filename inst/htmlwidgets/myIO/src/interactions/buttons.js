import { exportToCsv } from "../utils/export-csv.js";
import { getSVGString, svgString2Image } from "../utils/export-svg.js";
import { injectExportLegend } from "../utils/export-legend.js";
import { saveAs } from "../utils/file-saver.js";
import { exportToPDF } from "../utils/export-pdf.js";
import { copyAsPNG } from "../utils/export-clipboard.js";

export const BUTTON_LABELS = {
  chart: "Download data",
  image: "Save image",
  svg: "Save as SVG",
  pdf: "Export as PDF",
  clipboard: "Copy to clipboard",
  percent: "Toggle percent",
  group2stack: "Toggle layout"
};

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

  if (name === "svg") {
    var svgLegend = injectExportLegend(chart);
    var svgOut = getSVGString(chart.svg.node());
    svgLegend.cleanup();
    var svgBlob = new Blob([svgOut], { type: "image/svg+xml;charset=utf-8" });
    saveAs(svgBlob, chart.element.id + ".svg");
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

  if (name === "pdf") {
    exportToPDF(chart);
    return;
  }

  if (name === "clipboard") {
    copyAsPNG(chart);
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
  return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">' + paths + "</svg>";
}

export function iconImage() {
  return iconWrapper(
    '<rect x="3" y="3" width="18" height="18" rx="2"></rect>' +
    '<circle cx="8.5" cy="8.5" r="1.5"></circle>' +
    '<path d="m21 15-5-5L5 21"></path>'
  );
}

export { iconImage as iconCamera };

export function iconFileDown() {
  return iconWrapper('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M12 12v6"></path><path d="m9 15 3 3 3-3"></path>');
}

export function iconPercent() {
  return iconWrapper('<line x1="19" y1="5" x2="5" y2="19"></line><circle cx="7" cy="7" r="2"></circle><circle cx="17" cy="17" r="2"></circle>');
}

export function iconLayers() {
  return iconWrapper('<rect x="4" y="5" width="14" height="4" rx="1"></rect><rect x="6" y="10" width="14" height="4" rx="1"></rect><rect x="8" y="15" width="14" height="4" rx="1"></rect>');
}

export function iconLegend() {
  return iconWrapper(
    '<circle cx="5" cy="7" r="1.5"></circle>' +
    '<line x1="9" y1="7" x2="19" y2="7"></line>' +
    '<circle cx="5" cy="12" r="1.5"></circle>' +
    '<line x1="9" y1="12" x2="19" y2="12"></line>' +
    '<circle cx="5" cy="17" r="1.5"></circle>' +
    '<line x1="9" y1="17" x2="19" y2="17"></line>'
  );
}

export function iconPDF() {
  return iconWrapper(
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
    '<path d="M14 2v6h6"></path>' +
    '<text x="12" y="17" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-weight="bold">PDF</text>'
  );
}

export function iconClipboard() {
  return iconWrapper(
    '<rect x="8" y="2" width="8" height="4" rx="1"></rect>' +
    '<path d="M16 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1"></path>'
  );
}

export function iconDownload() {
  return iconWrapper(
    '<path d="M12 4v12"></path>' +
    '<path d="m8 12 4 4 4-4"></path>' +
    '<path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"></path>'
  );
}
