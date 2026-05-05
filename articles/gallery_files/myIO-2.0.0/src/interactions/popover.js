var MAX_LABEL_LENGTH = 30;

export function showPopover(chart, anchorPoint, options) {
  removePopover(chart);

  var container = d3.select(chart.dom.element);
  var popover = container.append("div")
    .attr("class", "myIO-popover")
    .attr("role", "dialog")
    .attr("aria-label", "Annotate data point");

  // Label input
  var labelSection = popover.append("div").attr("class", "myIO-popover-field");
  labelSection.append("label").text("Label:");

  var inputEl;
  if (options.presetLabels && options.presetLabels.length > 0) {
    inputEl = labelSection.append("select").attr("class", "myIO-popover-input");
    options.presetLabels.forEach(function(label) {
      inputEl.append("option").attr("value", label).text(label);
    });
    if (options.existingLabel) inputEl.property("value", options.existingLabel);
  } else {
    inputEl = labelSection.append("input")
      .attr("class", "myIO-popover-input")
      .attr("type", "text")
      .attr("maxlength", MAX_LABEL_LENGTH)
      .attr("placeholder", "Enter label...");
    if (options.existingLabel) inputEl.property("value", options.existingLabel);
  }

  // Category color picker
  var selectedColor = null;
  if (options.categoryColors) {
    var colorSection = popover.append("div").attr("class", "myIO-popover-field");
    colorSection.append("label").text("Category:");
    var colorPicker = colorSection.append("div").attr("class", "myIO-popover-colors");
    Object.keys(options.categoryColors).forEach(function(name) {
      var color = options.categoryColors[name];
      colorPicker.append("button")
        .attr("class", "myIO-popover-color-btn")
        .attr("type", "button")
        .attr("title", name)
        .attr("aria-label", name)
        .style("background-color", color)
        .on("click", function() {
          colorPicker.selectAll(".myIO-popover-color-btn").classed("selected", false);
          d3.select(this).classed("selected", true);
          selectedColor = color;
        });
    });
  }

  // Buttons
  var btnRow = popover.append("div").attr("class", "myIO-popover-buttons");

  if (options.existingLabel && options.onRemove) {
    btnRow.append("button")
      .attr("class", "myIO-popover-btn myIO-popover-btn--danger")
      .attr("type", "button")
      .text("Remove")
      .on("click", function() { removePopover(chart); options.onRemove(); });
  }

  btnRow.append("button")
    .attr("class", "myIO-popover-btn")
    .attr("type", "button")
    .text("Cancel")
    .on("click", function() {
      removePopover(chart);
      if (options.onCancel) options.onCancel();
    });

  btnRow.append("button")
    .attr("class", "myIO-popover-btn myIO-popover-btn--primary")
    .attr("type", "button")
    .text("Apply")
    .on("click", function() {
      var val = inputEl.property("value").trim().substring(0, MAX_LABEL_LENGTH);
      if (val) {
        removePopover(chart);
        options.onApply(val, selectedColor);
      }
    });

  positionPopover(chart, popover, anchorPoint);
  inputEl.node().focus();

  popover.on("keydown", function(event) {
    if (event.key === "Enter") {
      var val = inputEl.property("value").trim().substring(0, MAX_LABEL_LENGTH);
      if (val) { removePopover(chart); options.onApply(val, selectedColor); }
    }
    if (event.key === "Escape") {
      removePopover(chart);
      if (options.onCancel) options.onCancel();
    }
  });
}

function positionPopover(chart, popover, point) {
  var margin = chart.config.layout.margin;
  var x = point.px + margin.left;
  var y = point.py + margin.top - 10;

  popover
    .style("left", Math.max(4, Math.min(x - 80, chart.runtime.totalWidth - 180)) + "px")
    .style("bottom", (chart.runtime.height - y + 8) + "px");
}

export function removePopover(chart) {
  d3.select(chart.dom.element).selectAll(".myIO-popover").remove();
}
