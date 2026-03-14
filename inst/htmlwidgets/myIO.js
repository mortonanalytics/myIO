HTMLWidgets.widget({
  name: "myIO",
  type: "output",
  factory: function(el, width, height) {
    return {
      renderValue: function(x) {
        if (x.config && x.config.layers) {
          if (this.myIOchart) {
            this.myIOchart.updateChart(x.config);
          } else {
            this.myIOchart = new myIOchart({
              element: document.getElementById(el.id),
              config: x.config,
              width: width,
              height: height
            });
            if (HTMLWidgets.shinyMode) {
              var id = el.id;
              this.myIOchart.on("rollover", function(e) {
                Shiny.onInputChange("myIO-" + id + "-rollover", JSON.stringify(e.data));
              });
              this.myIOchart.on("dragEnd", function(e) {
                Shiny.onInputChange("myIO-" + id + "-dragEnd", JSON.stringify(e.point));
              });
              this.myIOchart.on("error", function(e) {
                Shiny.onInputChange("myIO-" + id + "-error", e.message);
              });
            }
          }
        }
      },
      resize: function(width, height) {
        if (this.myIOchart) {
          this.myIOchart.resize(width, height);
        }
      }
    };
  }
});
