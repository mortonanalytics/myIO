//myIO API
//author: Ryan Morton

////////////////////////////////////////////////////////////
////General Chart
////////////////////////////////////////////////////////////

var chart = function(opts) {
	
	//pass chart elements
	this.element = opts.element;
	this.plotLayers = opts.plotLayers;
	this.options = opts.options;

	//create the chart if it doesn't exist; update if it does
	
			this.draw();
		
}

chart.prototype.draw = function() {
	
	//define dimensions
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	this.margin = this.options.margin
	
	//set up parent element and SVG
	this.element.innerHTML = '';
	this.svg = d3.select(this.element).append('svg').attr('id', this.element.id);
	this.svg.attr('width', this.width);
	this.svg.attr('height', this.height);
	
	
	//create g element
	if(this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut"){
		this.plot = this.svg.append('g')
			.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	} else {
		this.plot = this.svg.append('g')
			.attr('transform','translate('+this.width/2+','+this.height/2+')');
	}
	
				
	this.chart = this.plot.append('g');
	
	//initialize chart
	this.initialize();
	
}

chart.prototype.initialize = function(){
	
	this.addButtons();
	
	if(this.plotLayers[0].type != "gauge"& 
	   this.plotLayers[0].type != "donut")this.setClipPath();
	//this.setZoom();
	///SCALES
	if(this.plotLayers[0].type != "treemap" & 
	   this.plotLayers[0].type != "gauge" & 
	   this.plotLayers[0].type != "donut"
	   )this.processScales(this.plotLayers);
	   
	///AXES
	if(this.plotLayers[0].type != "treemap" & 
	   this.plotLayers[0].type != "gauge" & 
	   this.plotLayers[0].type != "donut")this.addAxes();
	///ROUTER
	this.routeLayers();
	///REFERENCE LINES
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap"& 
	   this.plotLayers[0].type != "gauge" & 
	   this.plotLayers[0].type != "donut")this.addReferenceLines();
	///LEGEND
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "gauge" &
		   this.plotLayers[0].type != "donut" ){
			this.addLegend();
		}		
	} 
	///TOOL TIP
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap" &
	   this.plotLayers[0].type != "bar" &
	   this.plotLayers[0].type != "gauge" &
	   this.plotLayers[0].type != "donut" &
	   this.plotLayers[0].type != "point") {
		   this.addToolTip(this.plotLayers);
	   } else { 
			this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
			}
			
	
}

chart.prototype.setClipPath = function(){
	
	this.clipPath = this.plot.append('defs').append('svg:clipPath')
		.attr('id', this.element.id + 'clip')
	  .append('svg:rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
	this.chart.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
}

chart.prototype.setZoom = function() {
	var that = this;
	var m = this.margin;
	
	//define zoom behavior
	var zoom = d3.zoom()
		.scaleExtent([1,6])
		.translateExtent([
			[0,0],
			[this.width- (m.right + m.left), this.height - (m.top + m.bottom)]
		])
		.on('zoom', zoomed);
		
	//attach behavior to SVG
	this.svg.call(zoom);
	
	//what gets changed
	function zoomed () {
		that.plot.selectAll('.hexagon').attr("transform", d3.event.transform).style('opacity', d3.event.transform.k > 3.5 ? 0 : 1 );
		that.plot.selectAll('.hexPoint').selectAll('circle').style('opacity', d3.event.transform.k < 3.4 ? 0 : 1 );
		that.plot.selectAll('path').attr('transform', d3.event.transform);
		that.plot.selectAll('circle').attr('transform', d3.event.transform);
		that.plot.selectAll('line').attr('transform', d3.event.transform);
		
		that.svg.selectAll('.x.axis')
			.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(that.xScale).scale(d3.event.transform.rescaleX(that.xScale)))
				.selectAll("text")
					.attr('dy', '.35em')
					.style('text-anchor', 'center');
	
		that.svg.selectAll('.y.axis')
			.call(d3.axisLeft(that.yScale).scale(d3.event.transform.rescaleY(that.yScale)).ticks(null, "s"))
				.selectAll("text")
					.attr("dx", "-.25em");
		
		d3.select(that.element).select('.toolTip')
			.attr('transform', d3.event.transform);
			
		d3.select(that.element).select('.toolTipBox')
			.attr('transform', d3.event.transform);		
				
		d3.select(that.element).select('.toolLine')
			.attr('transform', d3.event.transform);

	}
	
}

chart.prototype.processScales = function(lys){
	var that = this;
	var m = this.margin;
	
	var x_extents = [];
	var y_extents = [];
	var x_bands = [];
	var y_bands = [];
	
	
	lys.forEach(function(d){
		var currentY = that.newY ? that.newY : d.mapping.y_var;
		
		if(that.options.flipAxis == false){
			var x_var = d.mapping.x_var; 
			var y_var = currentY;
		} else {
			var y_var = d.mapping.x_var; 
			var x_var = currentY;
		}		

		var x = d3.extent( d.data, function(e) { return +e[x_var]; });
		var y = d3.extent( d.data, function(e) { return +e[y_var]; });
		var x_cat = d.data.map(function(e) { return e[x_var]; });
		var y_cat = d.data.map(function(e) { return e[y_var]; });

		x_extents.push(x);
		y_extents.push(y);
		x_bands.push(x_cat);
		y_bands.push(y_cat);
	})

	//find min and max - X axis
	var x_min = d3.min(x_extents, function(d,i) {return d[0]; });
	var x_max = d3.max(x_extents, function(d,i) {return d[1]; });
	var x_check1 = d3.min(x_extents, function(d,i) {return d[0]; });
	var x_check2 = d3.max(x_extents, function(d,i) {return d[1]; });
	//prevent single tick on axis
	if(x_min == x_max) { x_min = x_min-1; x_max = x_max+1;}
	//calculate buffer
	var x_buffer = Math.max(Math.abs(x_max - x_min) * .05, 0.5) ;
	//user inputs if available
	//var final_x_min = this.options.xlim.min ? this.options.xlim.min : (x_min-x_buffer) ;

	if(lys[0].type == "bar" & this.options.categoricalScale == true){
		var final_x_min = Math.min(0, x_min);
		console.log(final_x_min);
	} else {
		var final_x_min = x_min-x_buffer;
	}
	
	var final_x_max = this.options.xlim.max ? this.options.xlim.max : (x_max+ x_buffer) ;
	var xExtent = [final_x_min, 
				   final_x_max ];
	
	//find min and max - Y axis
	var y_min = d3.min(y_extents, function(d,i) {return d[0]; });
	var y_max = d3.max(y_extents, function(d,i) {return d[1]; });
	//prevent single tick on axis
	if(y_min == y_max) { y_min = y_min-1; y_max = y_max+1;}
	//calculate buffer
	var y_buffer = Math.abs(y_max - y_min) * .15 ;
	//user inputs if available
	var final_y_min = this.options.ylim.min ? this.options.ylim.min : (y_min-y_buffer) ;
	var final_y_max = this.options.ylim.max ? this.options.ylim.max : (y_max+y_buffer) ;
	var yExtent = [(final_y_min), 
				   (final_y_max)];
	
	//create scales
	this.xScale = d3.scaleLinear()
		.range([0, this.width - (m.right + m.left)])
		.domain(xExtent);
	
	this.yScale =  d3.scaleLinear()
		.range([this.height - (m.top + m.bottom), 0])
		.domain(yExtent);
	
	function onlyUnique(value, index, self) { 
		return self.indexOf(value) === index;
	}
	
	this.x_banded = [].concat.apply([], x_bands).map(function(d){
		try {
			return d[0];
		}
		
		catch(err) {
			console.log(err.message);
		}
	}).filter(onlyUnique);
	
	this.y_banded = [].concat.apply([], y_bands).map(function(d){
		try {
			return d[0];
		}
		
		catch(err) {
			console.log(err.message);
		}
	}).filter(onlyUnique);
		
	this.bandedScale = d3.scaleBand()
		.range(this.options.flipAxis == true ? [this.height - (m.top + m.bottom), 0] : [0, this.width - (m.left + m.right)])
		.domain( this.options.flipAxis == true ? this.y_banded : this.x_banded );
	
	if(this.options.colorScheme){
		this.colorScheme = d3.scaleOrdinal()
		.range( this.options.colorScheme[0] )
		.domain( this.options.colorScheme[1] );
	}
	
	
	//assess if there's any data
	this.x_check = (x_check1 == 0 & x_check2 == 0) == 1;
}

chart.prototype.addAxes = function(){
	var that = this;
	var m = this.margin;
		
	//create and append axes
	if(this.options.categoricalScale == true & this.options.flipAxis == true){
		if(this.options.yAxisFormat){
			
			var xFormat = this.options.yAxisFormat == "yearMon" ? "s" : this.options.yAxisFormat ;
			
		} else {
			var xFormat = "s";
		}
		var finalFormat = d3.format(xFormat);
		
		this.plot.append('g')
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(this.xScale)
					.ticks(null,finalFormat))
					//.tickFormat(function(e){ if(Math.floor(+e) != +e){return;} return +e;}))
				.selectAll("text")
					.attr('dy', '.35em')
					.attr('text-anchor', 'center');
		
		if(this.options.xAxisFormat == "yearMon"){
			
			this.plot.select('.x.axis').selectAll('text')
				.text(function(d){ 
					if(Math.floor(+d) != +d){
						return ;
					} else {
						var e = d.toString();
						console.log(e);
						return e.slice(0,4) + "-" + e.slice(4,6) 
					}
					});
		}
		
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.bandedScale))
				.selectAll("text")
				.attr("dx", "-.25em");
		
	} else if(this.options.categoricalScale == true & this.options.flipAxis == false){
		this.plot.append('g')
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(this.bandedScale))
				.selectAll("text")
				.attr("dx", "-.25em");
					
		var yFormat = this.options.yAxisFormat ? this.options.yAxisFormat : "s";
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.yScale)
				.ticks(5, yFormat))
			.selectAll("text")
				.attr("dx", "-.25em");
		
	} else {
		if(this.options.xAxisFormat){
			var xFormat = this.options.xAxisFormat == "yearMon" ? "s" : this.options.xAxisFormat ;
		} else {
			var xFormat = "s";
		}
		
		this.plot.append('g')
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(this.xScale)
					.ticks(null,xFormat)
					.tickFormat(function(e){ if(Math.floor(+e) != +e){return;} return +e;}))
				.selectAll("text")
					.attr('dy', '.35em')
					.attr('text-anchor', 'center');
					
		if(this.options.xAxisFormat == "yearMon"){
			
			this.plot.select('.x.axis').selectAll('text')
				.text(function(d){ 
					if(Math.floor(+d) != +d){
						return ;
					} else {
						var e = d.toString();
						console.log(e);
						return e.slice(0,4) + "-" + e.slice(4,6) 
					}
					});
			this.svg.append("text")
				.attr('class', 'x label')
				.attr("transform",
					"translate(" + (this.width / 2) + " ," + 
								   (this.height- m.top + 15) + ")")
				.style("text-anchor", "middle")
				.text("Date");
		}
					
		var yFormat = this.options.yAxisFormat ? this.options.yAxisFormat : "s";
		var currentFormatY = this.newScaleY ? this.newScaleY : yFormat;
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.yScale)
				.ticks(5, currentFormatY))
			.selectAll("text")
				.attr("dx", "-.25em");
	}	
	if(this.options.suppressAxis.xAxis == true){this.svg.selectAll('.x.axis').remove();}
	if(this.options.suppressAxis.yAxis == true) {this.svg.selectAll('.y.axis').remove(); }
	//TO DO: find a different solution
	/*
	if(this.plotLayers.length == 1){
		this.svg.append("text")
			.attr('class', 'x label')
		  .attr("transform",
				"translate(" + (this.width / 2) + " ," + 
							   (this.height- m.top + 15) + ")")
		  .style("text-anchor", "middle")
		  .text(this.plotLayers[0].label);
	}
	*/
	// if(this.options.axisLabelOption.yAxis){
		// this.svg.append("text")
			// .attr('class', 'y label')
		  // .attr("transform", "rotate(-90)")
		  // .attr("y", 0)
		  // .attr("x",0 - (this.height / 2))
		  // .attr("dy", "1em")
		  // .style("text-anchor", "middle")
		  // .text(this.options.axisLabel.yAxis);  
	// }
}

chart.prototype.updateAxes = function() {
	
	var that = this;
	var m = this.margin;
		
	//update axes
	if(this.options.categoricalScale == true & this.options.flipAxis == true){
		if(this.options.yAxisFormat){
			var xFormat = this.options.yAxisFormat == "yearMon" ? "s" : this.options.yAxisFormat ;
			console.log(xFormat);
		} else {
			var xFormat = "s";
		}
		var finalFormat = d3.format(xFormat);
		
		this.svg.selectAll('.x.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(this.xScale)
					.ticks(null,finalFormat))
					//.tickFormat(function(e){ if(Math.floor(+e) != +e){return;} return +e;}))
				.selectAll("text")
					.attr('dy', '.35em')
					.style('text-anchor', 'center');
		
		if(this.options.xAxisFormat == "yearMon"){
			
			this.plot.select('.x.axis').selectAll('text')
				.text(function(d){ 
					if(Math.floor(+d) != +d){
						return ;
					} else {
						var e = d.toString();
						console.log(e);
						return e.slice(0,4) + "-" + e.slice(4,6) 
					}
					});
		}
					
		this.svg.selectAll('.y.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.call(d3.axisLeft(this.bandedScale))
				.selectAll("text")
					.attr("dx", "-.25em");
	} else if(this.options.categoricalScale == true & this.options.flipAxis == false){
		
		this.svg.selectAll('.x.axis')
			.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
			.transition().ease(d3.easeQuad)
			.duration(500)
			.call(d3.axisBottom(this.bandedScale))
				.selectAll("text")
					.attr("dx", "-.25em");
					
		var yFormat = this.options.yAxisFormat ? this.options.yAxisFormat : "s";
		this.svg.selectAll('.y.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.call(d3.axisLeft(this.yScale)
				.ticks(5,yFormat))
			.selectAll("text")
				.attr("dx", "-.25em");
		
	}else {
		
		if(this.options.xAxisFormat){
			var xFormat = this.options.xAxisFormat == "yearMon" ? "s" : this.options.xAxisFormat ;
		} else {
			var xFormat = "s";
		}
		this.svg.selectAll('.x.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
			.call(d3.axisBottom(this.xScale)
					.ticks(null,xFormat)
					.tickFormat(function(e){ if(Math.floor(e) != e){return;} return e;}))
				.selectAll("text")
					.attr('dy', '.35em')
					.style('text-anchor', 'center');
					
		if(this.options.xAxisFormat == "yearMon"){
			
			this.plot.select('.x.axis').selectAll('text')
				.text(function(d){ 
					if(Math.floor(+d) != +d){
						return ;
					} else {
						var e = d.toString();
						return e.slice(0,4) + "-" + e.slice(4,6) 
					}
					});
		}
		
		var yFormat = this.options.yAxisFormat ? this.options.yAxisFormat : "s";
		var currentFormatY = this.newScaleY ? this.newScaleY : yFormat;
		
		this.svg.selectAll('.y.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.call(d3.axisLeft(this.yScale)
				.ticks(5,currentFormatY))
			.selectAll("text")
				.attr("dx", "-.25em");
		
	}
}

chart.prototype.routeLayers = function() {
	var that = this;
	
	this.layerIndex = this.plotLayers.map(function(d) {return d.label; });
	
	this.plotLayers.forEach(function(d){
		
		var layerType = d.type;

		if(layerType == "line") {
			if(d.mapping.low_y) {that.addArea(d);}
			that.addLine(d);
			that.addPoints(d);
		} else if(layerType == "point") {
			if(d.mapping.low_y) { that.addCrosshairsY(d); }
			if(d.mapping.low_x) { that.addCrosshairsX(d); }
			that.addPoints(d);
		} else if(layerType == "stat_line") {
			that.addLine(d);
		} else if(layerType == "hexbin"){
			that.addHexBin(d);
			//that.addHexPoints(d);
		} else if(layerType == "treemap"){
			that.addTreemap(d);
		} else if(layerType == "bar"){
			that.addBars(d);
		} else if(layerType == "gauge"){
			that.makeGauge(d);
		} else if(layerType == "donut"){
			that.makeDonut(d);
		} else {alert("Wrong Layer Type! Can be: line, point, stat_line")}
		
	})
	
}

chart.prototype.routeFilteredLayers = function(lys) {
	var that = this;
	
	this.layerIndex = this.plotLayers.map(function(d) {return d.label; });
	
	lys.forEach(function(d){
		
		var layerType = d.type;

		if(layerType == "line") {
			if(d.mapping.low_y) {that.addArea(d);}
			that.addLine(d);
			that.addPoints(d);
		} else if(layerType == "point") {
			if(d.mapping.low_y) { that.addCrosshairsY(d); }
			if(d.mapping.low_x) { that.addCrosshairsX(d); }
			that.addPoints(d);
		} else if(layerType == "stat_line") {
			that.addLine(d);
		} else if(layerType == "hexbin"){
			that.addHexBin(d);
			//that.addHexPoints(d);
		} else if(layerType == "treemap"){
			that.addTreemap(d);
		} else if(layerType == "bar"){
			that.addBars(d);
		} else if(layerType == "gauge"){
			that.makeGauge(d);
		} else if(layerType == "donut"){
			that.makeDonut(d);
		} else {alert("Wrong Layer Type! Can be: line, point, stat_line")}
		
	})
	
}

chart.prototype.removeLayers = function(lys){
	//removes garbage if the layer no longer exists and isn't otherwise updated
	var that = this;
	
	lys.forEach(function(d) {
		console.log(d);
		d3.selectAll( '.tag-line-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-bar-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-point-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-hexbin-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-area-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-crosshairY-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-crosshairX-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
	})
}

chart.prototype.addBars = function(ly){
	var that = this;
	var m = this.margin;
	var data = ly.data;
	var key = ly.label;
	var barSize = ly.options.barSize == "small" ? 0.5 : 1;
	
	if(this.options.categoricalScale == true & this.options.flipAxis == true){
		var x_scale = this.xScale;
		var y_scale = this.bandedScale;
		var bandwidth = (this.height - (m.top + m.bottom)) / that.y_banded.length;
		console.log("CatInverted: " + bandwidth); 
	} else if(this.options.categoricalScale == true & this.options.flipAxis == false){ 
		var x_scale = this.bandedScale;
		var y_scale = this.yScale;
		var bandwidth = (this.width - (m.left + m.right)) / that.x_banded.length;
		console.log("CatNormal: " + bandwidth);
	} else {
		var x_scale = this.xScale;
		var y_scale = this.yScale;
		var bandwidth = Math.min(100, (this.width - (m.right + m.left)) / ly.data.length);
	}
	
	if(this.options.flipAxis == false){
		var bars = this.chart
			.selectAll('.tag-bar-' + that.element.id + '-'  + key.replace(/\s+/g, ''))
			//.selectAll('rect')
			.data(data);
		
		bars.exit()
			.transition().duration(500).attr('y', this.yScale(0))
			.remove();
		
		var newBars = bars.enter()
			.append('rect')
			.attr('class', 'tag-bar-' + that.element.id + '-'  + key.replace(/\s+/g, ''))
			.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
			.style('fill', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[ly.mapping.x_var]) : ly.color; 
				})
			.attr('x', function(d) { 
				if(that.options.categoricalScale == true){
					return x_scale(d[ly.mapping.x_var]);
				} else {
					return barSize == 1 ? x_scale(d[ly.mapping.x_var]) - (bandwidth/2) : x_scale(d[ly.mapping.x_var]) - (bandwidth/4); 
				}
				 
				})
			.attr('y', y_scale(0))
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', that.height -( m.top + m.bottom ))
			.on('mouseover', hoverTip)
			.on('mousemove', hoverTip)
			.on('mouseout', hoverTipHide);
			
		bars.merge(newBars)
			.transition()
			.ease(d3.easeQuad)
			.duration(1000)
			.attr('x', function(d) { 
				if(that.options.categoricalScale == true){
					return x_scale(d[ly.mapping.x_var]);
				} else {
					return barSize == 1 ? x_scale(d[ly.mapping.x_var]) - (bandwidth/2) : x_scale(d[ly.mapping.x_var]) - (bandwidth/4); 
				}
				 
				})
			.attr('y', function(d) { return y_scale(d[ly.mapping.y_var]); })
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', function(d) { return (that.height -( m.top + m.bottom )) - that.yScale(d[ly.mapping.y_var]); });
	} else {
		this.chart.selectAll('rect').remove();
		
		var bars = this.chart
			.selectAll('.tag-bar-' + that.element.id + '-'  + key.replace(/\s+/g, ''))
			//.selectAll('rect')
			.data(data);
		
		bars.exit()
			.transition().duration(500).attr('width', 0)
			.remove();
		
		var newBars = bars.enter()
			.append('rect')
			.attr('class', 'tag-bar-' + that.element.id + '-'  + key.replace(/\s+/g, ''))
			.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
			.style('fill', function(d){
				console.log(that.colorScheme(d[ly.mapping.x_var]));
				
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[ly.mapping.x_var]) : ly.color; 
				})
			.attr('y', function(d) { return barSize == 1? y_scale(d[ly.mapping.x_var]) : y_scale(d[ly.mapping.x_var]) + bandwidth/4 ;})
			.attr('x', function(d) { return x_scale(Math.min(0, d[ly.mapping.y_var])); })
			.attr('height', (barSize * bandwidth)-2)
			.attr('width', 0)
			.on('mouseover', hoverTip)
			.on('mousemove', hoverTip)
			.on('mouseout', hoverTipHide);
			
		bars.merge(newBars)
			.transition()
			.ease(d3.easeQuad)
			.duration(1000)
			.attr('y', function(d) { return barSize == 1? y_scale(d[ly.mapping.x_var]) : y_scale(d[ly.mapping.x_var]) + bandwidth/4 ;})
			.attr('x', function(d) { return x_scale(Math.min(0, d[ly.mapping.y_var])); })
			.attr('height', (barSize * bandwidth)-2)
			.attr('width', function(d) { return Math.abs(that.xScale(d[ly.mapping.y_var]) - that.xScale(0)); });
	}	
	
	function hoverTip(){
		var bar = d3.select(this);
		var barData = bar.data()[0];
		var exclusions = ["text", "yearMon"];
		var xFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ? d3.format(that.options.xAxisFormat ? that.options.xAxisFormat : "d") : function(x) {return x;} ;
		var yFormat = d3.format(that.options.yAxisFormat ? that.options.yAxisFormat : "d");
		var toolTipFormat = !(exclusions.indexOf(that.options.toolTipFormat) in exclusions) ?  d3.format(that.options.toolTipFormat ? that.options.toolTipFormat : "d"): function(x) {return x;} ;
		
		that.tooltip
              .style("left", (d3.mouse(this)[0] + m.left) + 'px')
			  .style("top", 5 + 'px')
              .style("display", "inline-block")
              .html(function() {
				   if(!ly.options.toolTipOptions){
					  
					  ly.options['toolTipOptions'] = {suppressY: false};

					  console.log(ly.options);
				  }

				  if(ly.mapping.toolTip2){
					  if(ly.options.toolTipOptions.suppressY == true){
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
						  ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) + '<br>' +
						  ly.mapping.toolTip2 + ": " + toolTipFormat(barData[ly.mapping.toolTip2])
					  } else {
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
						  ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var]) + '<br>' +
						  ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) + '<br>' +
						  ly.mapping.toolTip2 + ": " + toolTipFormat(barData[ly.mapping.toolTip2])
					  }
					
				  } else if(ly.mapping.toolTip){
					  if(ly.options.toolTipOptions.suppressY == true){
						  console.log("ToolTip format: " +toolTipFormat);
						 return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
							ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) 
					  } else {
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
							ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var]) + '<br>' +
							ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip])
					  }
					 
				  } else {
					return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
					ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var])
				  }
			  });
			  
	}
	
	function hoverTipHide(){
		that.tooltip.style("display", "none");
	}
	
}

chart.prototype.addLine = function(ly) {
	
	var that = this;
	
	var data = ly.data;
	var key = ly.label;
	
	var currentY = that.newY ? that.newY : ly.mapping.y_var;
	console.log(currentY)
	
	var valueLine = d3.line()
		.curve(d3.curveMonotoneX)
		.x(function( d ) { return that.xScale( d[ly.mapping.x_var] ); })
		.y(function( d ) { return that.yScale( d[ currentY ] ); });
	
	var linePath = this.chart
		.selectAll( '.tag-line-' + that.element.id + '-'  + key.replace(/\s+/g, '')) 
		.data([data]);
	
	//EXIT old elements not present in new data
	linePath.exit()
	  .transition().duration(500).style('opacity', 0)
		.remove();
	
	//ENTER new elements present in new data
	var newLinePath = linePath.enter().append("path")
		.attr("fill", "none")
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.style('stroke', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[ly.mapping.group]) : ly.color; 
				})
		.style("stroke-width", 3)
		.style('opacity', 0)
		.attr("class", 'tag-line-' + that.element.id + '-'  + key.replace(/\s+/g, '') );
		
	//UPDATE old elements present in new data
	linePath.merge(newLinePath)	
	  .transition()
	  .ease(d3.easeQuad)
	  .duration(1500)
		.style('opacity', 1)
		.style('stroke', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[0][ly.mapping.group]) : ly.color; 
				})
		.attr("d", valueLine);

}

chart.prototype.addArea = function(ly) {

	var that = this;
	
	var data = ly.data;
	var key = ly.label;
	
	var valueArea = d3.area()
		.curve(d3.curveMonotoneX)
		.x(function(d) { return that.xScale(d[ly.mapping.x_var]); })
		.y0(function(d) { return that.yScale(d[ly.mapping.low_y]); })
		.y1(function(d) { return that.yScale(d[ly.mapping.high_y]); });
		
	var linePath = this.chart
		.selectAll( '.tag-area-' + that.element.id + '-'  + key.replace(/\s+/g, '')) 
		.data([data]);
	
	//EXIT old elements not present in new data
	linePath.exit()
	  .transition().duration(500).style('opacity', 0)
		.remove();
	
	//ENTER new elements present in new data
	var newLinePath = linePath.enter().append("path")
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.style('fill', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[0][ly.mapping.group]) : ly.color; 
				})
		.style('opacity', 0)
		.attr("class", 'tag-area-' + that.element.id + '-'  + key.replace(/\s+/g, '') );
		
	//UPDATE old elements present in new data
	linePath.merge(newLinePath)
		.attr('clip-path', 'url(#' + that.element.id + 'clip' + ')')
	  .transition()
		.ease(d3.easeQuad)
		.duration(1500)
		.attr("d", valueArea)
	  .transition()
		.ease(d3.easeQuad)
		.duration(1500)
		.style('opacity', 0.4);
}

chart.prototype.addPoints = function(ly) {
	
	var that = this;

	//join data to points
	var points = this.chart
		.selectAll( '.tag-point-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
		.data(ly.data);

	points.exit()
	  .transition().remove();
	
	points.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
	  .transition()
	  .ease(d3.easeQuad)
	  .duration(1500)
		.style('fill', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[ly.mapping.group]) : ly.color; 
				})
		.attr('cx', function(e) { return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ that.newY ? that.newY : ly.mapping.y_var ] ); })
	
	points.enter()
		.append('circle')
		.attr('r', 3)
		.style('fill', function(d){
				return that.options.colorScheme[2] == "on" ? that.colorScheme(d[ly.mapping.group]) : ly.color; 
				})
		.style('opacity', 0)
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.attr('cx', function(e) {return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ that.newY ? that.newY : ly.mapping.y_var ] ); })
		.attr("class", 'tag-point-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  )
	  .transition()
		.ease(d3.easeQuad)
		.duration(1500)
		.style('opacity', 1);

	if(this.options.dragPoints == true) { this.dragPoints(ly); }	
}

chart.prototype.dragPoints = function(ly){
	var that = this;
	
	var drag = d3.drag()
	.on('start', dragStart)
	.on('drag', dragging)
	.on('end', dragEnd);
	
	this.chart.selectAll('circle')
		.call(drag);
		
	function dragStart(d) {
		d3.select(this).raise().classed('active', true);
	}
	
	function dragging(d) {
		d[0] = that.xScale.invert(d3.event.x);
		d[1] = that.yScale.invert(d3.event.y);
		
		d3.select(this)
			.attr('cx', that.xScale(d[0]))
			.attr('cy', that.yScale(d[1]));
	}
	
	function dragEnd(d){
		d3.select(this).classed('active', false);
		
		var points = [];
		that.chart.selectAll('circle').each(function(){
			var x = that.xScale.invert(this.getAttribute('cx'));
			var y = that.yScale.invert(this.getAttribute('cy'));	
			var point = {
				x_var:x,
				y_var:y
			}
			points.push(point)
		});
		
		that.updateRegression(points);
		
		if(HTMLWidgets.shinyMode) {
			var x = points.map(function(d){return d['x_var']; });
			var y = points.map(function(d){return d['y_var']; });
			var est = points.map(function(d){return d['y_est']; });
			console.log(y);
			Shiny.onInputChange('myIOpointsX', x);
			Shiny.onInputChange('myIOpointsY', y);
			Shiny.onInputChange('myIOpointsEst', est);
		}
		
	}
	var points = [];
	this.chart.selectAll('circle').each(function(){
			var x = that.xScale.invert(this.getAttribute('cx'));
			var y = that.yScale.invert(this.getAttribute('cy'));	
			var point = {
				x_var:x,
				y_var:y
			}
			points.push(point)
		});
	that.updateRegression(points);
}

chart.prototype.updateRegression = function(points){
	
	var that = this;
	//define line function
	var valueLine = d3.line()
		.x(function(d){ return that.xScale(d.x_var); })
		.y(function(d) {return that.yScale(d.y_est); });
	
	//regress points
	var regression = linearRegression(points, "y_var", "x_var");
	
	if(HTMLWidgets.shinyMode) {
		console.log("regressionSent");
		Shiny.onInputChange('myIOregression', regression);
	}
	
	points.forEach(function(d){
	 d.y_est = regression.fn(d.x_var);
	});
	
	var newPoints = points.sort(function(a,b){ return a.x_var - b.x_var; });
	
	//data join regressed points
	var linePath = this.chart
		.selectAll( '.tag-regression-line-' + that.element.id)
		.data([newPoints]);
	
	//EXIT old elements not present in new data
	linePath.exit()
	  .transition().duration(500).style('opacity', 0)
		.remove();
	
	//ENTER new elements present in new data
	var newLinePath = linePath.enter().append("path")
		.attr("fill", "none")
		.style("stroke", "orange")
		.style("stroke-width", 3)
		.style('opacity', 0)
		.attr("class", 'tag-regression-line-' + that.element.id );
		
	//UPDATE old elements present in new data
	linePath.merge(newLinePath)	
	  .transition()
	  .ease(d3.easeQuad)
	  .duration(1500)
		.style('opacity', 1)
		.attr("d", valueLine);	
	
}

chart.prototype.addHexPoints = function(ly) {
	
	var that = this;
	console.log(ly);
	//join data to points
	var points = this.chart
		.append('g')
		.attr('class', 'hexPoint')
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.selectAll( '.tag-point-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
		.data(ly.data);

	points.exit()
	  .transition().remove();
	
	points
	  .transition()
	  .ease(d3.easeQuad)
	  .duration(1500)
		.attr('cx', function(e) { return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ly.mapping.y_var] ); })
	
	points.enter()
		.append('circle')
		.attr('r', 1)
		.style('fill',  ly.color )
		.attr('cx', function(e) {return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ly.mapping.y_var] ); })
		.attr("class", 'tag-point-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  )
		.style('opacity', 0);
}

chart.prototype.addHexBin = function(ly){
	var that = this;
	
	//create points	
	var points = ly.data.map(function(d) { return  { 0: that.xScale(+d[ly.mapping.x_var]), 1: that.yScale(+d[ly.mapping.y_var]) } ; });
	var x_extent = d3.extent(ly.data, function(d) { return +d[ly.mapping.x_var]; })
	var y_extent = d3.extent(ly.data, function(d) { return +d[ly.mapping.y_var]; })
	
	//color scale
	var color = d3.scaleSequential(d3.interpolateHslLong("white", "steelblue"))
		.domain([0, 200]);
		
	//hexbin function
	var hexbin = d3.hexbin()
		.radius(20)
		.extent([
			[x_extent[0], y_extent[0]],
			[x_extent[1], y_extent[1]]
		]);
			
	//data join
	var bins = this.chart
		.append('g')
		.attr('class', 'hexagon')
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.selectAll( '.tag-hexbin-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
		.data(hexbin(points));
	
	//EXIT
	bins.exit()
	  .transition().remove();
	  
	//ENTER
	var newbins = bins.enter()
		.append('path')
		.attr("class", 'tag-hexbin-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  )
		.attr('d', hexbin.hexagon())
		.attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })	
		.attr('fill', 'white');
		
	//UPDATE
	bins.merge(newbins)
		.transition()
			.ease(d3.easeQuad)
			.duration(1500)
		.attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })
		.attr('fill', function(d) { return color(d.length); });
}

chart.prototype.addTreemap = function(ly) {
	
	var that = this;
	var m = this.margin;
	var format = d3.format(",d")
	var key = ly.label;
	// create hierarchy from data
	var root = d3.hierarchy(ly.data)
		.eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
		.sum(sumBySize)
		.sort(function(a,b) { return b.height - a.height || b.value - a.value});
	
	// define treemap function
	var treemap = d3.treemap()
		.tile(d3.treemapResquarify)
		.size([
			this.width - (m.left + m.right),
			this.height - (m.top + m.bottom)
		])
		.round(true)
		.paddingInner(1);
	
	treemap(root);
	console.log(root);
	// define color scale
	var color = d3.scaleOrdinal(ly.color);
	
	// data join
	var cell = this.chart
		.selectAll('.root')
		.data(root.leaves());
		
	// EXIT
	cell.exit().remove();
	
	// ENTER
	var newCell = cell.enter()
		.append('g')
		.attr('class', 'root')
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.attr('transform', function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });
	
	// append rect
	newCell.append("rect")
		.attr('class', 'tag-tree-' + that.element.id + '-'  + key.replace(/\s+/g, ''))
		.attr('id', function(d) { return d.data.id; })
		.attr('width', function(d) { return d.x1 - d.x0; })
		.attr('height', function(d) { return d.y1 - d.y0; })
		//.attr('opacity', 0.5)
		.attr('fill', function(d) { while (d.depth > 1) d = d.parent; return color(d.data.id); });
	
	// UPDATE
	cell.merge(newCell)
		.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
        .attr("width", function(d) { return d.x1 - d.x0; })

        .attr("height", function(d) { return d.y1 - d.y0; })
		.attr('fill', function(d) { while (d.depth > 1) d = d.parent; return color(d.data.id); });

		
	// append text
	newCell.append('text')
		.selectAll('tspan')
		.data(function(d) { 
			var name = d.data[ly.mapping.x_var];
			return name[0].split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)); 
		})
		.enter().append('tspan')
		.attr('x', 3)
		.attr('y', function(d,i,nodes) { return (i === nodes.length - 1) * 3 + 16 + (i - 0.5) * 9; })
		.attr('fill-opacity',  function(d,i) { 
			return this.parentNode.parentNode.getBBox().width > 40 ? 1 : 0; 
			})
		.attr('fill', 'black')
		.text(function(d) { return d; });
		
	// append title/tooltip
	newCell.append('title')
		.text(function(d) { 
			return d.data[ly.mapping.level_1] + "  \n" + 
				d.data[ly.mapping.level_2] + " \n" +
				d.data[ly.mapping.x_var] + "  \n" +
				format(d.value); })
				
	// append text
	cell.selectAll('text').remove();
	
	cell.append('text')
		.selectAll('tspan')
		.data(function(d) { 
			var name = d.data[ly.mapping.x_var];
			return name[0].split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)); 
		})
		.enter().append('tspan')
		.attr('x', 3)
		.attr('y', function(d,i,nodes) { return (i === nodes.length - 1) * 3 + 16 + (i - 0.5) * 9; })
		.attr('fill-opacity',  function(d,i) { 
			return this.parentNode.parentNode.getBBox().width > 40 ? 1 : 0; 
			})
		.attr('fill', 'black')

		.text(function(d) { return d; });
		
	// append title/tooltip
	cell.selectAll('title').remove();
	
	cell.append('title')
		.text(function(d) { 
			return d.data[ly.mapping.level_1] + "  \n" + 
				d.data[ly.mapping.level_2] + "  \n" +
				d.data[ly.mapping.x_var] + "  \n" +

				format(d.value); })
	
	//helper functions
	function sumBySize(d) {
		return d[ly.mapping.y_var];
	}
	
}

chart.prototype.addCrosshairsY = function(ly) {
	var that = this;
	
	var crosshairsY = this.chart
		.selectAll( '.tag-crosshairY-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
		.data(ly.data);
	
	crosshairsY.exit()
	  .transition().remove();
	  	  
	crosshairsY
		.transition()
		.ease(d3.easeQuad)
		.duration(1500)
		.attr('x1', function(d) { return that.xScale(d[ly.mapping.x_var]); })
		.attr('x2', function(d) { return that.xScale(d[ly.mapping.x_var]); })
		.attr('y1', function(d) { return that.yScale(d[ly.mapping.low_y]); })
		.attr('y2', function(d) { return that.yScale(d[ly.mapping.high_y]); });
		
	crosshairsY.enter()
		.append('line')
		.style('fill', 'none')
		.style('stroke', 'black')
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.style('opacity', 0.5)
		.attr('x1', function(d) { return that.xScale(d[ly.mapping.x_var]); })
		.attr('x2', function(d) { return that.xScale(d[ly.mapping.x_var]); })
		.attr('y1', function(d) { return that.yScale(d[ly.mapping.low_y]); })
		.attr('y2', function(d) { return that.yScale(d[ly.mapping.high_y]); })
		.attr("class", 'tag-crosshairY-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  );
}

chart.prototype.addCrosshairsX = function(ly) {
	var that = this;
	
	var crosshairsX = this.chart
		.selectAll( '.tag-crosshairX-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
		.data(ly.data);
	
	crosshairsX.exit()
	  .transition().remove();
	  	  
	crosshairsX
		.transition()
		.duration(1500)
		.ease(d3.easeQuad)
		.attr('x1', function(d) { return that.xScale(d[ly.mapping.low_x]); })
		.attr('x2', function(d) { return that.xScale(d[ly.mapping.high_x]); })
		.attr('y1', function(d) { return that.yScale(d[ly.mapping.y_var]); })
		.attr('y2', function(d) { return that.yScale(d[ly.mapping.y_var]); });
		
	crosshairsX.enter()
		.append('line')
		.style('fill', 'none')
		.style('stroke', 'black')
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.style('opacity', 0.5)
		.attr('x1', function(d) { return that.xScale(d[ly.mapping.low_x]); })
		.attr('x2', function(d) { return that.xScale(d[ly.mapping.high_x]); })
		.attr('y1', function(d) { return that.yScale(d[ly.mapping.y_var]); })
		.attr('y2', function(d) { return that.yScale(d[ly.mapping.y_var]); })
		.attr("class", 'tag-crosshairX-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  );
}

chart.prototype.addReferenceLines = function() {
	
	var that = this;
	var m =  this.margin;
	
	var xRef = this.options.referenceLine.x;
	var yRef = this.options.referenceLine.y;
	
	if(xRef) {
		var xRefLine = this.chart
			.selectAll('.ref-x-line')
			.data([xRef]);
		
		xRefLine.exit() 
			.transition().duration(500)
			.style('opacity', 0)
			.attr('y2', this.height - (m.top + m.bottom))
			.remove();
		
		var newxRef =xRefLine.enter().append('line')
			.attr('class', 'ref-x-line')
			.attr('fill', 'none')
			.style('stroke', 'gray')
			.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
			.attr('x1', function(d) { return that.xScale(d); })
			.attr('x2', function(d) { return that.xScale(d); })
			.attr('y1', this.height - (m.top + m.bottom))
			.attr('y2', this.height - (m.top + m.bottom ))
			.transition()
			.ease(d3.easeQuad)
			.duration(1500)
			.attr('y2', 0);
		
		xRefLine
			.transition()
			.ease(d3.easeQuad)
			.duration(1500)
			.attr('x1', function(d) { return that.xScale(d); })
			.attr('x2', function(d) { return that.xScale(d); })
			.attr('y1', this.height - (m.top + m.bottom))
			.attr('y2', 0);
			
	}
	
	if(yRef) {
		var yRefLine = this.chart
			.selectAll('.ref-y-line')
			.data([yRef]);
			
		yRefLine.exit()
			.transition().duration(500)
			.attr('y2', this.width - (m.left + m.right))
			.style('opacity', 0)
			.remove();
			
		var newyRef = yRefLine.enter().append('line')
			.attr('class', 'ref-y-line')
			.attr('fill', 'none')
			.style('stroke', 'gray')
			.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
			.attr('x1', 0)
			.attr('x2', 0)
			.attr('y1', function(d) { return that.yScale(d); })
			.attr('y2',  function(d) { return that.yScale(d); })
			.transition()
			.ease(d3.easeQuad)
			.duration(1500)
			.attr('x2', this.width - (m.left + m.right));
			
		yRefLine.merge(newyRef)
			.transition()
			.ease(d3.easeQuad)
			.duration(1500)
			.attr('x1', 0)
			.attr('x2', this.width - (m.left + m.right))
			.attr('y1', function(d) { return that.yScale(d); })
			.attr('y2',  function(d) { return that.yScale(d); });
	}
		
}

chart.prototype.addLegend = function() {
	
	var that = this;
	var m = this.margin;
	
	d3.select('.legend-box').remove();
	d3.selectAll('.legendElement').remove();
	
	var svg = d3.select(this.element).select('svg');
	
	var labelIndex = this.plotLayers.map(function(d) { return d.label; });
	
	//create legend	box (exists in the background)
	var legendBox = svg.append('rect')
		.attr('class', 'legend-box')
		.attr("x", this.width - 70)
		.attr("transform", function(d) { return "translate(0,40)";})
		//.attr("y", 35)
		.attr('width', '150px')
		.attr('height', (this.plotLayers.length * 20) + 'px')
		.style('fill', 'white')
		.style('opacity', 0.75);
		
	this.plotLayers.forEach(function(d){
		
		var legendElement = svg.append('g')
			.selectAll('.legendElement')
			.data([d.label])
			.enter()
			.append('g')
			.attr('class', 'legendElement')
			.attr("transform", function(d) { return "translate(0," +  (40 + labelIndex.indexOf(d)* 20) + ")"; })
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "end")
			.on('click', toggleLine);
			
		if(d.type == 'line'){
			legendElement.append("rect")
				.attr("x", that.width - 12)
				.attr('y', 5)
				.attr("width", 12)
				.attr("height", 12)
				.attr("fill", d.color)
				.attr("stroke", d.color);
		} else if(d.type == 'point'){
			legendElement.append("circle")
				.attr("cx", that.width - 5)
				.attr('cy', 6)
				.attr('r', 5)
				.attr("fill", d.color)
				.attr("stroke", d.color);
		} else {
			legendElement.append("rect")
				.attr("x", that.width - 12)
				.attr("width", 12)
				.attr("height", 12)
				.attr("fill", d.color)
				.attr("stroke", d.color);
		}
		
		legendElement.append("text")
			.attr("x", that.width - 15)
			.attr("y", 9.5)
			.attr("dy", "0.35em")
			.attr('font-size', 12)
			.text(function(d) { return d; });
			
	})
	
	var filteredElements = [];
		
	function toggleLine(){
		var selectedData = d3.select(this).data();
		
		//toggle elements in and out of filteredElements
		if(filteredElements.length < 1) {
			
			filteredElements.push(selectedData[0]);
			
			d3.select(this)
				.style('opacity', 0.5);
				
			d3.select(this).select('rect')
				.attr('fill-opacity', 0);
				
			d3.select(this).select('circle')
				.attr('fill-opacity', 0);	
			
		} else if ( !filteredElements.includes(selectedData[0]) ){
			
			filteredElements.push(selectedData[0]);
			
			d3.select(this)
				.style('opacity', 0.5);
				
			d3.select(this).select('rect')
				.attr('fill-opacity', 0);
				
			d3.select(this).select('circle')
				.attr('fill-opacity', 0);
				
		} else if ( filteredElements.includes(selectedData[0]) ){
			
			filteredElements = filteredElements.filter(function(d){
				return d != selectedData[0];
			});
			d3.select(this).style('opacity', 1);
			
			d3.select(this).select('rect')
				.attr('fill-opacity', 1);
			
			d3.select(this).select('circle')
				.attr('fill-opacity', 1);
		}
		
		var filteredLayers = that.plotLayers.filter(function(d){
			return filteredElements.indexOf(d.label) === -1;
		});
		
		var removedLayers = that.plotLayers
			.filter(function(d){
				return filteredElements.indexOf(d.label) > -1;
			})
			.map(function(d) { return d.label; });;
	
		/*
		that.chart
			.selectAll( '.tag-line-' + that.element.id + '-'  + selectedData[0].replace(/\s+/g, '') )
			.remove();
			
		that.chart
			.selectAll( '.tag-point-' + that.element.id + '-'  + selectedData[0].replace(/\s+/g, '') )
			.remove();
			*/
		that.processScales(filteredLayers);
		that.routeFilteredLayers(filteredLayers);
		that.removeLayers(removedLayers);
		that.updateAxes();
		that.addToolTip(filteredLayers);
		that.addButtons();
		
	}
}

chart.prototype.updateLegend = function() {
	
	this.addLegend();
}

chart.prototype.addToolTip = function(lys) {
	var that = this;
	//add tooltip to body

	d3.select(this.element).select('.toolTip').remove();
	this.chart.select('.toolLine').remove();
	this.svg.select('.toolTipBox').remove();
	
	var tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
	var toolLine =  this.chart.append('line').attr('class', 'toolLine');
	var format1d = d3.format('.0f');
	var exclusions = ["text", "yearMon"];
	
	var xFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ? d3.format(that.options.xAxisFormat ? that.options.xAxisFormat : "d") : function(x) {return x;} ;
	
	var yFormat = d3.format(this.options.yAxisFormat ? this.options.yAxisFormat : "d");
	var currentFormatY = this.newScaleY ? d3.format(this.newScaleY) : yFormat;
	
	var toolTipFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ?  d3.format(that.options.toolTipFormat ? that.options.toolTipFormat : "d"): function(x) {return x;} ;
	
	var tipBox = this.svg.append("rect")
			.attr('class', 'toolTipBox')
			.attr("opacity", 0)
			.attr("width", that.width - (that.margin.left + that.margin.right))
			.attr("height", that.height - ( that.margin.top + that.margin.bottom))
			.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
			.on("mouseover", function() { 
					tooltip.style("display", null); toolLine.style("stroke", null); 
				})
			.on("mouseout", function() { 
				tooltip.style("display", "none"); toolLine.style("stroke", "none"); 
				})
			.on("mousemove", scalePointPosition);
			
	function scalePointPosition() {
			
			var tipText = [];
			var mouse = d3.mouse(this);
			
			//line tool tip text
			lys.forEach(function(d,i) {	
				
				console.log(d);
				var key = d.label;
				var color = d.color;
				var values = d.data;
				
				var x_var = d.mapping.x_var;
				
				var currentY = that.newY ? that.newY : d.mapping.y_var;
				var y_var = currentY;
				
				var toolTip_var = d.mapping.toolTip;
				
				var xPos =  that.xScale.invert(mouse[0]);
				var bisect = d3.bisector(function(d) {return d[x_var]; }).left;
				var idx = bisect(values, xPos);

				var d0 = values[idx-1];
				var d1 = values[idx];
				if(d0 == undefined | d1 == undefined) return
				var v = xPos - d0[x_var] > d1[x_var] - xPos ? d1 : d0;	

				var finalObject = {
					color: color,
					label: key,
					x_var: x_var,
					y_var: y_var,
					toolTip_var: toolTip_var,
					values: v
				}
				tipText.push(finalObject);
			});
			
	toolLine
		.style('stroke', 'darkgray')
		.style('stroke-dasharray', '3,3')
		.attr('x1', that.xScale(tipText[0].values[tipText[0].x_var]))
		.attr('x2', that.xScale(tipText[0].values[tipText[0].x_var]))
		.attr('y1',0)
		.attr('y2', that.height - (that.margin.top +that.margin.bottom));
		
	tooltip
		.style('display', 'inline-block')
		.style('opacity', 0.9)
		.style("left", (that.xScale(tipText[0].values[tipText[0].x_var]) + that.margin.left) + 'px')
		.style("top", 0 + 'px')
		.html(function() { 
			console.log(tipText[0]);
			if(tipText[0].toolTip_var){			
				return tipText[0].x_var + ": " + xFormat(tipText[0].values[tipText[0].x_var]) + '<br>' + 
				tipText[0].y_var + ": " + yFormat(tipText[0].values[tipText[0].y_var]) + '<br>' +
				tipText[0].toolTip_var + ": " + toolTipFormat(tipText[0].values[tipText[0].toolTip_var])
			  } else {
				  var y_text = []
				  tipText.forEach(function(d){
					y_text.push('<font color="' + d.color + '">' + d.label + '</font>' + ": " + currentFormatY(d.values[d.y_var]) + '<br>' );
				});
				console.log(y_text.join(' '));
				return tipText[0].x_var + ": " + xFormat(tipText[0].values[tipText[0].x_var]) + '<br>' + y_text.join(' ');
				
				
				//tipText[0].y_var + ": " + yFormat(tipText[0].values[tipText[0].y_var])
			  }
		});
	}
}

chart.prototype.updateToolTip = function() {
	
	var that = this;
	
	var tipBox = d3.select(this.element).select('.toolTipBox')
			.attr("width", that.width - (that.margin.left + that.margin.right))
			.attr("height", that.height - ( that.margin.top + that.margin.bottom))
			.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
}

chart.prototype.makeDonut = function(ly) {
	var that = this;
	var m = this.margin;

	//define gauge variable
	var twoPi = 2 * Math.PI;
	var radius = Math.min(this.width - (m.right + m.left), this.height - (m.top + m.bottom))/2;
	var barWidth = 30 ;
	
	var pie = d3.pie()
		.sort(null)
		.value(function(d) { 
			return d[ly.mapping.y_var]; 
			});
	
	var arc = d3.arc()
	  .innerRadius(radius * 0.8)
	  .outerRadius(radius * 0.4);
	  
	var outerArc  = d3.arc()
	  .innerRadius(radius * 0.9)
	  .outerRadius(radius * 0.9);
	  
	var data = ly.data;
	console.log(pie(data));
	var color = d3.scaleOrdinal(ly.color);
	
	var key = function(d){ return d.data[ly.mapping.x_var]; };
	
	//data join
	var path = this.chart
		.selectAll('.donut')
		.data(pie(data));
	 
	path.exit().remove();
	
	var newPath = path.enter()
		.append('path')
		.attr('class', 'donut')
		.attr('fill', function(d,i) { return color(i); })
		.attr('d', arc)
		.each(function(d) { this._current = 0; })
		.on('mouseover', hoverTip)
		.on('mousemove', hoverTip)
		.on('mouseout', hoverTipHide);
		
	path.merge(newPath).transition()
		.duration(1500)
		.attr('fill', function(d,i) { return color(i); })
		.attrTween('d', arcTween)

	/* ------- TEXT LABELS -------*/

	var text = this.plot.selectAll("text")
		.data(pie(data));

	var newText = text.enter()
		.append("text")
		.attr('class', 'donut-text')
		.style('font-size', '12px')
		.style('opacity', 0)
		.attr("dy", ".35em")
		.text(function(d) {
			return d.data[ly.mapping.x_var];
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.merge(newText).transition().duration(1000)
		.text(function(d) {
				return d.data[ly.mapping.x_var];
			})
		.style('opacity', function(d){
			var wedgeSize =  Math.abs(d.endAngle - d.startAngle);
			if(wedgeSize > 0.3) {
				return 1;
				} else {
					return 0;
				}
		})
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = this.plot.selectAll("polyline")
		.data(pie(data));
	
	var newPolyline = polyline.enter()
		.append("polyline")
		.style('fill', 'none')
		.style('stroke-width', '1px')
		.style('opacity', 0)
		.style('stroke' , 'gray');

	polyline.merge(newPolyline).transition().duration(1000)
		.style('opacity', function(d){
			console.log(d);
			var wedgeSize =  Math.abs(d.endAngle - d.startAngle);
			if(wedgeSize > 0.3) {
				return 1;
				} else {
					return 0;
				}
		})
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};			
		});
	
	polyline.exit()
		.remove();
		
	function arcTween(a) {
	  this._current = this._current || a;		
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        return arc(i(t));
      };
    }
	
	function hoverTip(){
		var bar = d3.select(this);
		var barData = bar.data()[0].data;
		var exclusions = ["text", "yearMon"];
		var xFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ? d3.format(that.options.xAxisFormat ? that.options.xAxisFormat : "d") : function(x) {return x;} ;
		var yFormat = d3.format(that.options.yAxisFormat ? that.options.yAxisFormat : "d");
		var toolTipFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ?  d3.format(that.options.toolTipFormat ? that.options.toolTipFormat : "d"): function(x) {return x;} ;
		
		that.tooltip
              .style("left", 10 + 'px')
			  .style("top", 5 + 'px')
              .style("display", "inline-block")
              .html(function() {
				   if(!ly.options.toolTipOptions){
					  
					  ly.options['toolTipOptions'] = {suppressY: false};

				  }
				  
				  if(ly.mapping.toolTip2){
					  if(ly.options.toolTipOptions.suppressY == true){
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
						  ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) + '<br>' +
						  ly.mapping.toolTip2 + ": " + toolTipFormat(barData[ly.mapping.toolTip2])
					  } else {
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
						  ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var]) + '<br>' +
						  ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) + '<br>' +
						  ly.mapping.toolTip2 + ": " + toolTipFormat(barData[ly.mapping.toolTip2])
					  }
					
				  } else if(ly.mapping.toolTip){
					  if(ly.options.toolTipOptions.suppressY == true){
						 return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
							ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip]) 
					  } else {
						  return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
							ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var]) + '<br>' +
							ly.mapping.toolTip + ": " + toolTipFormat(barData[ly.mapping.toolTip])
					  }
					 
				  } else {
					return ly.mapping.x_var + ": " + xFormat(barData[ly.mapping.x_var]) + '<br>' + 
					ly.mapping.y_var + ": " + yFormat(barData[ly.mapping.y_var])
				  }
			  });
			  
	}
	
	function hoverTipHide(){
		that.tooltip.style("display", "none");
	}
}

chart.prototype.makeGauge = function(ly){
	var that = this;
	var m = this.margin;
	
	//define gauge variable
	var twoPi = Math.PI;
	var radius = Math.min(this.width, this.height)/2;
	var barWidth = 30 ;
	var progress = ly.data[0].value[0];
		
	//define gauge functions
	var arc = d3.arc()
		.innerRadius(radius-barWidth)
		.outerRadius(radius)
		.startAngle(0);
	
	var percentFormat = d3.format(".1%")
	
	function arcTween(newAngle){

			var interpolate = d3.interpolate(this._current, newAngle);
			this.current = i(0);
			return function(t){
				return arc(interpolate(d));
			};
		
	}

	//create gauge
	if(!background){
	  var background = this.chart
		.append('path')
		.attr('class', 'background')
		.style('fill', "gray")
		.attr('transform', 'rotate(-90)')
		.attr('d', arc.endAngle(twoPi));

	}
	/* var arcs = this.chart
		.selectAll('.foreground')
		.data([ (progress * twoPi) ]);
		
	arcs
		.transition().duration(1000)
		.attrTween('d', arcTween);
		
	arcs.enter().append('path')
		.attr('class', 'foreground')
		.attr('fill', ly.color)
		.attr('transform', 'rotate(-90)')
		.attr('d', function(d) {return arc.endAngle(d * twoPi); })
		.each(function(d) { this._current = d; }); */
	if(!foreground){
		var foreground = this.chart
			.append('path')
			.style('fill', ly.color)
			.attr('class','foreground')
			.attr('transform', 'rotate(-90)')
			.attr('d', arc.endAngle(progress * twoPi));
	} else {
		foreground
			.transition().duration(1000)
			.attrTween('d', function(d) { console.log("tween"); return arcTween(progress * twoPi); });
	}

	this.chart.selectAll('.gauge-text').remove();
	
	var label = this.chart
			.append('g')
			.append('text')
			.text(percentFormat(progress))
			.attr('class', 'gauge-text')
			.attr('text-anchor', 'middle')
			.attr('font-size', 20)
			.attr('dy', '-0.45em');
	
}

chart.prototype.update = function(x){
	var that = this;
	var m = this.margin;
	
	//layer comparison to identify layers no longer needed
	this.plotLayers = x.layers;
	var newLayers = x.layers.map(function(d) { return d.label; });
	var oldLayers = [];
	this.layerIndex.forEach(function(d){
			var x = newLayers.indexOf(d);
			if(x < 0) {
				oldLayers.push(d);
				}
		});
	
	//update dimensions
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	this.options = x.options;
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.processScales(this.plotLayers);
	
	if(this.x_check ){
		
	} else {
		if(this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut"){
		this.plot
			.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	} else {
		this.plot
			.attr('transform','translate('+this.width/2+','+this.height/2+')');
	}
	
	//update all the other stuff
	this.options = x.options;
	
	this.addButtons();
	this.svg.select('.legend-box').remove();
	this.svg.selectAll('.legendElement').remove();
	
	this.options.referenceLine = x.options.referenceLine;
	if(this.plotLayers[0].type == "gauge")this.draw();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut")this.processScales(this.plotLayers);
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut")this.updateAxes();
	this.routeLayers();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut")this.addReferenceLines();
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "gauge" &
		   this.plotLayers[0].type != "donut"){
			this.updateLegend();
			
		}		
	} 
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap"&
       this.plotLayers[0].type != "gauge" &	  
		this.plotLayers[0].type != "donut" &
	   this.plotLayers[0].type != "bar" )this.addToolTip(this.plotLayers);
	this.removeLayers(oldLayers);
	}
	
	
	
	
}

chart.prototype.resize = function(){
	var that = this;
	
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	
	this.addButtons();
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	if(this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut"){
		this.plot 
			.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
		this.clipPath
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
	} else {
		this.plot 
			.attr('transform','translate('+this.width/2+','+this.height/2+')');
	}
	
	
	
	if(this.plotLayers[0].type == "gauge")this.draw();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut")this.processScales(this.plotLayers);
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge" & this.plotLayers[0].type != "donut")this.updateAxes();
	this.routeLayers();
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "donut" &
		   this.plotLayers[0].type != "gauge"){
			this.updateLegend();
		}		
	} 
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap"&
       this.plotLayers[0].type != "gauge" &	 
	   this.plotLayers[0].type != "donut" &	   
	   this.plotLayers[0].type != "bar" )this.updateToolTip();
	if(this.options.dragPoints == true) { 

		//define line function
		var valueLine = d3.line()
			.x(function(d){ return that.xScale(d.x_var); })
			.y(function(d){ return that.yScale(d.y_est); });
		
		console.log(this.chart.selectAll( '.tag-regression-line-' + that.element.id));
		this.chart
			.selectAll( '.tag-regression-line-' + that.element.id)
			.attr('d', function(d) {return valueLine(d.datapoints); });
	}
	
	
}

chart.prototype.addButtons = function(){
	var that = this;
	
	if(this.options.toggleY){
		var tempData = ["\uf019 \uf080", "\uf019 \uf0ce", "\uf0b2"];
		var divLength = 0.18;
	} else {
		var tempData = ["\uf019 \uf080", "\uf019 \uf0ce"];
		var divLength = 0.15;
	}
			
	 d3.select(this.element).select('.buttonDiv').remove();

	var buttonDiv = d3.select(this.element).append("div")
		.attr("class", "buttonDiv")
		.style('opacity', 1)
		.style("left", ( that.width - (divLength * that.width) ) + 'px')
		.style("top", '0px');
		/*
		.on("mouseover", function() { 
					 
					d3.select(that.element).select(".buttonDiv")
						.style('opacity', 1);
				})
			.on("mouseout", function() { 
				
				d3.select(that.element).select(".buttonDiv")
					.style('opacity', 0);
				})
			.on("mousemove", function(){
				d3.select(that.element).select(".buttonDiv")
					.style('opacity', 1);
			});
		*/
	
	var buttons = buttonDiv.selectAll('.button')
		.data(tempData)
	  .enter()
		.append('input')
		.attr('class', 'button')		
		//.attr("transform", function(d) { return "translate(" +  tempData.indexOf(d)* 20 + ", 0)"; })
		.attr('value', function(d){ console.log(d); return d; })
		.on('click', function(d){
			console.log(d + " Clicked!");
			if(d == "\uf019 \uf080"){
				var svgString = getSVGString(that.svg.node());
				svgString2Image( svgString, 2*that.width, 2*that.height, 'png', save ); // passes Blob and filesize String to the callback

				function save( dataBlob, filesize ){
					saveAs( dataBlob, that.element.id + '.png' ); // FileSaver.js function
				}
			} else if(d == "\uf019 \uf0ce"){
				var csvData =  [];
			
				that.plotLayers.forEach(function(d){
						csvData.push(d.data);
					});
					
				var finalCSVData = [].concat.apply([], csvData);
				
				exportToCsv(that.element.id + '_data.csv', finalCSVData)
			} else if(d == "\uf0b2"){
				
				if(that.toggleY){
				
					if(that.toggleY[0] == that.options.toggleY[0]){
						
						that.toggleY = [that.plotLayers[0].mapping.y_var, that.options.yAxisFormat];
						
					} else if(that.toggleY[0] == that.plotLayers[0].mapping.y_var){
						
						that.toggleY = that.options.toggleY;
						
					}
					
				} else {
					that.toggleY = that.options.toggleY;
				}
				
				that.toggleVarY(that.toggleY);
			}
				
			});
	
}

chart.prototype.toggleVarY = function(newY){
	
	this.newY = newY[0];
	this.newScaleY = newY[1]
	this.processScales(this.plotLayers);
	this.updateAxes();
	this.routeLayers();
	this.addToolTip(this.plotLayers);
	this.updateLegend();
}
/////////////////////
///General Functions
/////////////////////
function linearRegression(data,y_var,x_var){
		
		var x = data.map(function(d) { return d[x_var]; });
		var y = data.map(function(d) { return d[y_var]; });
		
		var lr = {};
		var n = y.length;
		var sum_x = 0;
		var sum_y = 0;
		var sum_xy = 0;
		var sum_xx = 0;
		var sum_yy = 0;
		
		for (var i = 0; i < y.length; i++) {
			
			sum_x += x[i];
			sum_y += y[i];
			sum_xy += (x[i]*y[i]);
			sum_xx += (x[i]*x[i]);
			sum_yy += (y[i]*y[i]);
		} 
		
		lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
		lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
		lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
		lr['fn'] = function (x) { return this.slope * x + this.intercept; };
		return lr;
}

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		
		console.log(extractedCSSText);
		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;
}

function exportToCsv(filename, rows) {
	
	var jsonObject = JSON.stringify(rows);
	
    function ConvertToCSV(objArray) {
            var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
			
			var names = Object.keys(array[0]).toString();
						
            var str = names + '\r\n';

            for (var i = 0; i < array.length; i++) {
                var line = '';
                for (var index in array[i]) {
                    if (line != '') line += ','

                    line += array[i][index];
                }

                str += line + '\r\n';
            }

            return str;
        }

    var csvFile = ConvertToCSV(jsonObject);

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},o=t.createElementNS("http://www.w3.org/1999/xhtml","a"),r="download"in o,i=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},a=/Version\/[\d\.]+.*Safari/.test(navigator.userAgent),c=e.webkitRequestFileSystem,d=e.requestFileSystem||c||e.mozRequestFileSystem,u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},s="application/octet-stream",f=0,l=4e4,v=function(e){var t=function(){"string"==typeof e?n().revokeObjectURL(e):e.remove()};setTimeout(t,l)},p=function(e,t,n){t=[].concat(t);for(var o=t.length;o--;){var r=e["on"+t[o]];if("function"==typeof r)try{r.call(e,n||e)}catch(i){u(i)}}},w=function(e){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\uFEFF",e],{type:e.type}):e},y=function(t,u,l){l||(t=w(t));var y,m,S,h=this,R=t.type,O=!1,g=function(){p(h,"writestart progress write writeend".split(" "))},b=function(){if(m&&a&&"undefined"!=typeof FileReader){var o=new FileReader;return o.onloadend=function(){var e=o.result;m.location.href="data:attachment/file"+e.slice(e.search(/[,;]/)),h.readyState=h.DONE,g()},o.readAsDataURL(t),void(h.readyState=h.INIT)}if((O||!y)&&(y=n().createObjectURL(t)),m)m.location.href=y;else{var r=e.open(y,"_blank");void 0===r&&a&&(e.location.href=y)}h.readyState=h.DONE,g(),v(y)},E=function(e){return function(){return h.readyState!==h.DONE?e.apply(this,arguments):void 0}},N={create:!0,exclusive:!1};return h.readyState=h.INIT,u||(u="download"),r?(y=n().createObjectURL(t),void setTimeout(function(){o.href=y,o.download=u,i(o),g(),v(y),h.readyState=h.DONE})):(e.chrome&&R&&R!==s&&(S=t.slice||t.webkitSlice,t=S.call(t,0,t.size,s),O=!0),c&&"download"!==u&&(u+=".download"),(R===s||c)&&(m=e),d?(f+=t.size,void d(e.TEMPORARY,f,E(function(e){e.root.getDirectory("saved",N,E(function(e){var n=function(){e.getFile(u,N,E(function(e){e.createWriter(E(function(n){n.onwriteend=function(t){m.location.href=e.toURL(),h.readyState=h.DONE,p(h,"writeend",t),v(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&b()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=h["on"+e]}),n.write(t),h.abort=function(){n.abort(),h.readyState=h.DONE},h.readyState=h.WRITING}),b)}),b)};e.getFile(u,{create:!1},E(function(e){e.remove(),n()}),E(function(e){e.code===e.NOT_FOUND_ERR?n():b()}))}),b)}),b)):void b())},m=y.prototype,S=function(e,t,n){return new y(e,t,n)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(e,t,n){return n||(e=w(e)),navigator.msSaveOrOpenBlob(e,t||"download")}:(m.abort=function(){var e=this;e.readyState=e.DONE,p(e,"abort")},m.readyState=m.INIT=0,m.WRITING=1,m.DONE=2,m.error=m.onwritestart=m.onprogress=m.onwrite=m.onabort=m.onerror=m.onwriteend=null,S)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!==define.amd&&define([],function(){return saveAs});