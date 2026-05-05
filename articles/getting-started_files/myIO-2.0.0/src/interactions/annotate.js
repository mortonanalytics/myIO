import { showPopover, removePopover } from "./popover.js";
import { showStatusBar, removeStatusBar } from "./status-bar.js";
import { exportToCsv } from "../utils/export-csv.js";
import { tagName } from "../utils/responsive.js";

var ANNOTATABLE_TYPES = ["point", "bar", "histogram", "hexbin", "groupedBar"];

export function bindAnnotation(chart) {
  var cfg = chart.config.interactions.annotation;
  if (!cfg || !cfg.enabled) return;

  if (!chart.runtime._annotations) chart.runtime._annotations = [];

  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return ANNOTATABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector)
      .on("click.annotate", function(event, d) {
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
          onCancel: function() {}
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
    label: label,
    category: color || null,
    layerLabel: layer.label,
    timestamp: new Date().toISOString()
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

  var marks = group.selectAll(".myIO-annotation-mark")
    .data(chart.runtime._annotations || [], function(d) { return d._source_key; });

  marks.exit().remove();

  var enter = marks.enter().append("g")
    .attr("class", "myIO-annotation-mark");

  enter.append("circle")
    .attr("r", 8)
    .attr("fill", "none")
    .attr("stroke-width", 2);

  enter.append("text")
    .attr("dy", -12)
    .attr("text-anchor", "middle")
    .attr("class", "myIO-annotation-label");

  var merged = enter.merge(marks);
  merged.attr("transform", function(d) {
    return "translate(" + chart.xScale(d.x) + "," + chart.yScale(d.y) + ")";
  });
  merged.select("circle")
    .style("stroke", function(d) {
      return d.category || "var(--chart-annotation-ring)";
    });
  merged.select("text")
    .text(function(d) {
      return d.label.length > 30 ? d.label.substring(0, 27) + "\u2026" : d.label;
    })
    .style("font-size", "var(--chart-annotation-font-size)")
    .style("fill", "var(--chart-text-color)");
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
    { label: "Clear", handler: function() { clearAnnotations(chart); } }
  ]);
}

function findAnnotation(chart, sourceKey) {
  return (chart.runtime._annotations || []).find(function(a) {
    return a._source_key === sourceKey;
  });
}

export function removeAnnotationBindings(chart) {
  removePopover(chart);
}
