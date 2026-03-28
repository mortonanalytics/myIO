import { getSVGString, svgString2Image } from "./export-svg.js";

export async function copyAsSVG(chart) {
  var svgString = getSVGString(chart.svg.node());
  try {
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
      var blob = new Blob([svgString], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob })
      ]);
    } else {
      await navigator.clipboard.writeText(svgString);
    }
    return true;
  } catch (err) {
    console.warn("myIO: Clipboard copy failed", err);
    return false;
  }
}

export async function copyAsPNG(chart) {
  var svgString = getSVGString(chart.svg.node());
  var width = (chart.totalWidth || chart.width) * 2;
  var height = chart.height * 2;

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
