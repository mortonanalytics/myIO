HTMLWidgets.widget({

  name: 'myIO',

  type: 'output',

  factory: function(el, width, height) {

    return {

      renderValue: function(x) {
		if(x.layers) {
			if(this.myIOchart){
				this.myIOchart.updateChart(x);
			} else {

				this.myIOchart = new myIOchart({
					element: document.getElementById(el.id),
					plotLayers: x.layers,
					options: x.options,
					width: width,
					height: height
					});
			}
		}
      },

      resize: function(width, height) {
			if(this.myIOchart){
				//this.myIOchart.draw();
				this.myIOchart.resize(width, height);
			} 
					
      }

    };
  }
});