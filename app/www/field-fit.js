// Size the field tracking widget to its content: pitch at 105x68 plus the
// controls and event strip, which wrap differently at each width. Mirrors the
// fit used by the production-bundle fixture (tests/playwright/fixtures).
(function () {
  var ID = "fieldPlot";

  function fit() {
    var el = document.getElementById(ID);
    if (!el || !window.HTMLWidgets) return;
    var widget = HTMLWidgets.find("#" + ID);
    var chart = widget && widget.myIOchart;
    var host = el.querySelector(".myIO-field");
    if (!chart || !chart.dom || !host) return;
    var width = el.clientWidth;
    var height = host.offsetHeight + 16;
    if (el.style.height !== height + "px") el.style.height = height + "px";
    if (chart.width !== width || chart.height !== height) chart.resize(width, height);
  }

  $(document).on("shiny:value", function (event) {
    if (event.name !== ID) return;
    setTimeout(function () {
      var widget = HTMLWidgets.find("#" + ID);
      if (widget && widget.myIOchart && !widget.myIOchart._fieldFit) {
        widget.myIOchart._fieldFit = true;
        widget.myIOchart.on("resize", fit);
      }
      fit();
    }, 0);
  });
  window.addEventListener("resize", fit);
})();
