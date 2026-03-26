export function bindSliders(chart) {
  var sliders = chart.config.interactions.sliders;
  if (!sliders || sliders.length === 0) return;

  removeSliders(chart);
  chart.runtime._sliderTimers = [];

  var container = d3.select(chart.dom.element);
  var wrapper = container.append("div").attr("class", "myIO-slider-wrapper");

  sliders.forEach(function(cfg) {
    var row = wrapper.append("div").attr("class", "myIO-slider-row");

    row.append("label")
      .attr("class", "myIO-slider-label")
      .attr("for", chart.dom.element.id + "-slider-" + cfg.param)
      .text(cfg.label);

    var input = row.append("input")
      .attr("type", "range")
      .attr("class", "myIO-slider-input")
      .attr("id", chart.dom.element.id + "-slider-" + cfg.param)
      .attr("min", cfg.min)
      .attr("max", cfg.max)
      .attr("step", cfg.step || "any")
      .attr("aria-label", cfg.label)
      .attr("aria-valuemin", cfg.min)
      .attr("aria-valuemax", cfg.max)
      .attr("aria-valuenow", cfg.value)
      .property("value", cfg.value);

    var valueSpan = row.append("span")
      .attr("class", "myIO-slider-value")
      .text(formatSliderValue(cfg.value, cfg.step));

    if (!HTMLWidgets.shinyMode) {
      input.attr("disabled", true)
        .attr("title", "Parameter sliders require Shiny");
      row.style("opacity", "0.5");
      return;
    }

    var timerIdx = chart.runtime._sliderTimers.length;
    chart.runtime._sliderTimers.push(null);
    var debounceMs = cfg.debounce || 200;
    input.on("input", function() {
      var val = +this.value;
      valueSpan.text(formatSliderValue(val, cfg.step));
      d3.select(this).attr("aria-valuenow", val);
      clearTimeout(chart.runtime._sliderTimers[timerIdx]);
      chart.runtime._sliderTimers[timerIdx] = setTimeout(function() {
        Shiny.onInputChange(
          "myIO-" + chart.dom.element.id + "-slider-" + cfg.param,
          val
        );
        chart.emit("sliderChanged", { param: cfg.param, value: val });
      }, debounceMs);
    });
  });
}

function formatSliderValue(value, step) {
  if (step && step < 1) {
    var decimals = String(step).split(".")[1];
    return value.toFixed(decimals ? decimals.length : 2);
  }
  return String(value);
}

export function removeSliders(chart) {
  if (chart.runtime._sliderTimers) {
    chart.runtime._sliderTimers.forEach(clearTimeout);
    chart.runtime._sliderTimers = null;
  }
  d3.select(chart.dom.element).selectAll(".myIO-slider-wrapper").remove();
}
