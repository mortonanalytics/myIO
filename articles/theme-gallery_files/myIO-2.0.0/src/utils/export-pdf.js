import { injectExportLegend } from "./export-legend.js";
import { getSVGString, svgString2Image } from "./export-svg.js";
import { loadJsPDF } from "./load-jspdf.js";

/**
 * Export chart as PDF using jsPDF.
 * Renders SVG to canvas at 3x resolution, then adds to PDF.
 */
export function exportToPDF(chart) {
  return loadJsPDF().then(function(JsPDF) {
    var legend = injectExportLegend(chart);
    var exportHeight = chart.height + legend.extraHeight;
    var svgString = getSVGString(chart.svg.node());
    legend.cleanup();

    var w = chart.totalWidth || chart.width;
    var h = exportHeight;
    var scale = 3;

    return new Promise(function(resolve) {
      svgString2Image(svgString, w * scale, h * scale, "png", function(blob) {
        var reader = new FileReader();
        reader.onload = function() {
          var dataUrl = reader.result;
          var orientation = (w > h) ? "landscape" : "portrait";

          // A4 in points (1pt = 1/72 inch)
          var pageW = orientation === "landscape" ? 842 : 595;
          var pageH = orientation === "landscape" ? 595 : 842;
          var margin = 36; // 0.5 inch
          var availW = pageW - 2 * margin;
          var availH = pageH - 2 * margin;
          var fitScale = Math.min(availW / w, availH / h);
          var imgW = w * fitScale;
          var imgH = h * fitScale;

          var doc = new JsPDF({
            orientation: orientation,
            unit: "pt",
            format: [pageW, pageH]
          });

          var title = (chart.config.export && chart.config.export.title) ||
                      (chart.config.axes && chart.config.axes.xAxisLabel) ||
                      "myIO Chart";
          doc.setProperties({ title: title, creator: "myIO" });

          var x = (pageW - imgW) / 2;
          var y = (pageH - imgH) / 2;

          doc.addImage(dataUrl, "PNG", x, y, imgW, imgH);
          doc.save(chart.element.id + ".pdf");
          resolve(true);
        };
        reader.readAsDataURL(blob);
      });
    });
  });
}
