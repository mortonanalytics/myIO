HTMLWidgets.widget({
  name: "myIO",
  type: "output",
  factory: function(el, width, height) {
    return {
      renderValue: function(x) {
        if (x.config && x.config.layers) {
          if (this.myIOchart) {
            // Destroy and recreate to handle layer count/type changes cleanly
            this.myIOchart.destroy();
            d3.select(el).selectAll("*").remove();
            this.myIOchart = null;
          }
          if (!this.myIOchart) {
            this.myIOchart = new myIOchart({
              element: document.getElementById(el.id),
              config: x.config,
              width: width,
              height: height
            });
            var id = el.id;
            this.myIOchart.on("error", function(e) {
              el._myIO_lastError = {
                message: e.message,
                layer: e.layer ? e.layer.label : null,
                timestamp: new Date().toISOString()
              };
              if (HTMLWidgets.shinyMode) {
                Shiny.onInputChange("myIO-" + id + "-error", e.message);
              }
            });
            if (HTMLWidgets.shinyMode) {
              this.myIOchart.on("rollover", function(e) {
                Shiny.onInputChange("myIO-" + id + "-rollover", JSON.stringify(e.data));
              });
              this.myIOchart.on("dragEnd", function(e) {
                Shiny.onInputChange("myIO-" + id + "-dragEnd", JSON.stringify(e.point));
              });
              this.myIOchart.on("brushed", function(e) {
                Shiny.onInputChange("myIO-" + id + "-brushed", JSON.stringify(e));
              });
              this.myIOchart.on("annotated", function(e) {
                Shiny.onInputChange("myIO-" + id + "-annotated", JSON.stringify(e));
              });
            }
          }
        }
      },
      resize: function(width, height) {
        if (this.myIOchart) {
          if (this.myIOchart.facetController) {
            this.myIOchart.facetController.resize();
          } else {
            this.myIOchart.resize(width, height);
          }
        }
      }
    };
  }
});
