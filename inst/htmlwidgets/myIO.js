HTMLWidgets.widget({

  name: 'myIO',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {
        // general chart with layers
		if(x.layers) {
			if(this.chart){
				this.chart.update(x);
			} else {
				console.log(x);
				this.chart = new chart({
					element: document.getElementById(el.id),
					plotLayers: x.layers,
					options: x.options
					});
			}
		}

      },

      resize: function(width, height) {
		//chart will use its own resize method
        if(this.chart) {
			this.chart.resize();
		}

      }

    };
  }
});