import { injectExportLegend } from "./export-legend.js";
import { getSVGString, svgString2Image } from "./export-svg.js";

export async function copyAsSVG(chart) {
  var legend = injectExportLegend(chart);
  var svgString = getSVGString(chart.svg.node());
  legend.cleanup();

  try {
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
      var blob = new Blob([svgString], { type: "image/svg+xml" });
      var htmlBlob = new Blob([svgString], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "image/svg+xml": blob })
      ]);
    } else {
      await navigator.clipboard.writeText(svgString);
    }
    return true;
  } catch (err) {
    console.warn("[myIO] Clipboard copy failed", err);
    return false;
  }
}

export async function copyAsPNG(chart) {
  var legend = injectExportLegend(chart);
  var exportHeight = chart.height + legend.extraHeight;
  var svgString = getSVGString(chart.svg.node());
  legend.cleanup();

  var width = (chart.totalWidth || chart.width) * 2;
  var height = exportHeight * 2;

  return new Promise(function(resolve) {
    svgString2Image(svgString, width, height, "png", function(blob) {
      if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
        navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]).then(function() { resolve(true); })
          .catch(function() { resolve(false); });
      } else {
        resolve(false);
      }
    });
  });
}
