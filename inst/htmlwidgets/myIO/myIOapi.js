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
	this.svg = d3.select(this.element).append('svg');
	this.svg.attr('width', this.width);
	this.svg.attr('height', this.height);
	
	//create g element
	if(this.plotLayers[0].type != "gauge"){
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
	
	if(this.plotLayers[0].type != "gauge")this.setClipPath();
	//this.setZoom();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.processScales(this.plotLayers);
	if(this.plotLayers[0].type != "treemap" & this.plotLayers[0].type != "gauge")this.addAxes();
	this.routeLayers();
	if(this.plotLayers[0].type != "hexbin" & this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.addReferenceLines();
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "gauge"){
			this.addLegend();
		}		
	} 
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap" &
	   this.plotLayers[0].type != "bar" &
	   this.plotLayers[0].type != "gauge" &
	   this.plotLayers[0].type != "point") {
		   this.addToolTip();
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
	var y_bands = [];
	
	lys.forEach(function(d){
		if(that.options.flipAxis == false){
			var x_var = d.mapping.x_var; 
			var y_var = d.mapping.y_var;
		} else {
			var y_var = d.mapping.x_var; 
			var x_var = d.mapping.y_var;
		}		
		
		var x = d3.extent( d.data, function(e) { return +e[x_var]; });
		var y = d3.extent( d.data, function(e) { return +e[y_var]; });
		var y_cat = d.data.map(function(e) { return e[y_var]; });

		x_extents.push(x);
		y_extents.push(y);
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

	this.y_banded = [].concat.apply([], y_bands).map(function(d){
		return d[0];
	}).filter(onlyUnique);
	
	console.log(this.y_banded);
	this.bandedScale = d3.scaleBand()
		.range([this.height - (m.top + m.bottom), 0])
		.domain(this.y_banded);
	
	//assess if there's any data
	this.x_check = (x_check1 == 0 & x_check2 == 0) == 1;
}

chart.prototype.addAxes = function(){
	var that = this;
	var m = this.margin;
		
	//create and append axes
	if(this.options.categoricalScale == true & this.options.flipAxis == true){
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
		}
		
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.bandedScale))
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
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.yScale)
				.ticks(null, yFormat))
			.selectAll("text")
				.attr("dx", "-.25em");
	}	
	if(this.options.suppressAxis.xAxis == true){this.svg.selectAll('.x.axis').remove();}
	if(this.options.suppressAxis.yAxis == true) {this.svg.selectAll('.y.axis').remove(); }
	if(this.plotLayers.length == 1){
		this.svg.append("text")
			.attr('class', 'x label')
		  .attr("transform",
				"translate(" + (this.width / 2) + " ," + 
							   (this.height- m.top + 15) + ")")
		  .style("text-anchor", "middle")
		  .text(this.plotLayers[0].label);
	}
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
	} else {
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
						console.log(e);
						return e.slice(0,4) + "-" + e.slice(4,6) 
					}
					});
		}
		
		var yFormat = this.options.yAxisFormat ? this.options.yAxisFormat : "s";
		this.svg.selectAll('.y.axis')
			.transition().ease(d3.easeQuad)
			.duration(500)
			.call(d3.axisLeft(this.yScale)
				.ticks(null,yFormat))
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
		var y_scale = this.bandedScale;
		var bandwidth = (this.height - (m.top + m.bottom)) / that.y_banded.length;
	} else {
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
			.style('fill', ly.color)
			.attr('x', function(d) { return barSize == 1 ? that.xScale(d[ly.mapping.x_var]) - (bandwidth/2) : that.xScale(d[ly.mapping.x_var]) - (bandwidth/4); })
			.attr('y', this.yScale(0))
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', that.height -( m.top + m.bottom ))
			.on('mouseover', hoverTip)
			.on('mousemove', hoverTip)
			.on('mouseout', hoverTipHide);
			
		bars.merge(newBars)
			.transition()
			.ease(d3.easeQuad)
			.duration(1000)
			.attr('x', function(d) { return barSize == 1 ? that.xScale(d[ly.mapping.x_var]) - (bandwidth/2) : that.xScale(d[ly.mapping.x_var]) - (bandwidth/4); })
			.attr('y', function(d) { return that.yScale(d[ly.mapping.y_var]); })
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', function(d) { return (that.height -( m.top + m.bottom )) - that.yScale(d[ly.mapping.y_var]); });
	} else {
		
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
			.style('fill', ly.color)
			.attr('y', function(d) { return barSize == 1? y_scale(d[ly.mapping.x_var]) : y_scale(d[ly.mapping.x_var]) + bandwidth/4 ;})
			.attr('x', function(d) { return that.xScale(Math.min(0, d[ly.mapping.y_var])); })
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
			.attr('x', function(d) { return that.xScale(Math.min(0, d[ly.mapping.y_var])); })
			.attr('height', (barSize * bandwidth)-2)
			.attr('width', function(d) { return Math.abs(that.xScale(d[ly.mapping.y_var]) - that.xScale(0)); });
	}	
	
	function hoverTip(){
		var bar = d3.select(this);
		var barData = bar.data()[0];
		var exclusions = ["text", "yearMon"];
		var xFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ? d3.format(that.options.xAxisFormat ? that.options.xAxisFormat : "d") : function(x) {return x;} ;
		var yFormat = d3.format(that.options.yAxisFormat ? that.options.yAxisFormat : "d");
		var toolTipFormat = !(exclusions.indexOf(that.options.xAxisFormat) in exclusions) ?  d3.format(that.options.toolTipFormat ? that.options.toolTipFormat : "d"): function(x) {return x;} ;
		
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
	
	var valueLine = d3.line()
		.curve(d3.curveMonotoneX)
		.x(function( d ) { return that.xScale( d[ly.mapping.x_var] ); })
		.y(function( d ) { return that.yScale( d[ly.mapping.y_var] ); });
	
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
		.style("stroke", ly.color)
		.style("stroke-width", 3)
		.style('opacity', 0)
		.attr("class", 'tag-line-' + that.element.id + '-'  + key.replace(/\s+/g, '') );
		
	//UPDATE old elements present in new data
	linePath.merge(newLinePath)	
	  .transition()
	  .ease(d3.easeQuad)
	  .duration(1500)
		.style('opacity', 1)
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
		.attr("fill", ly.color)
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
		.attr('cx', function(e) { return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ly.mapping.y_var] ); })
	
	points.enter()
		.append('circle')
		.attr('r', 3)
		.style('fill',  ly.color )
		.style('opacity', 0)
		.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
		.attr('cx', function(e) {return that.xScale( e[ly.mapping.x_var] ); })
		.attr('cy', function(e) { return that.yScale( e[ly.mapping.y_var] ); })
		.attr("class", 'tag-point-' + that.element.id + '-' + ly.label.replace(/\s+/g, '')  )
	  .transition()
		.ease(d3.easeQuad)
		.duration(1500)
		.style('opacity', 0.7);

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
		.attr('id', function(d) { return d.data.id; })
		.attr('width', function(d) { return d.x1 - d.x0; })
		.attr('height', function(d) { return d.y1 - d.y0; })
		.attr('opacity', 0.5)
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
		.attr('fill-opacity',  function(d,i,nodes) { return i === nodes.length - 1 ? 0.9 : null; })
		//.attr('fill', 'black')
		.text(function(d) { return d; });
		
	// append title/tooltip
	newCell.append('title')
		.text(function(d) { 
			return d.data[ly.mapping.level_1] + " \\ \n" + 
				d.data[ly.mapping.level_2] + " \\ \n" +
				d.data[ly.mapping.x_var] + " \\ \n" +
				format(d.value); })
	
	// UPDATE
	cell.merge(newCell)
		.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
	
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
	
	var svg = d3.select(this.element).select('svg');
	
	var labelIndex = this.plotLayers.map(function(d) { return d.label; });
	
	//create legend	box (exists in the background)
	var legendBox = svg.append('rect')
		.attr('class', 'legend-box')
		.attr("x", this.width - 70)
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
			.attr("transform", function(d) { return "translate(0," +  labelIndex.indexOf(d)* 20 + ")"; })
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "end");
			
		if(d.type == 'line'){
			legendElement.append("rect")
				.attr("x", that.width - 12)
				.attr('y', 5)
				.attr("width", 12)
				.attr("height", 3)
				.attr("fill", d.color);
		} else if(d.type == 'point'){
			legendElement.append("circle")
				.attr("cx", that.width - 5)
				.attr('cy', 6)
				.attr('r', 3)
				.attr("fill", d.color);
		} else {
			legendElement.append("rect")
				.attr("x", that.width - 12)
				.attr("width", 12)
				.attr("height", 12)
				.attr("fill", d.color);
		}
		
		legendElement.append("text")
			.attr("x", that.width - 15)
			.attr("y", 9.5)
			.attr("dy", "0.15em")
			.text(function(d) { return d; });
			
	})
	
}

chart.prototype.updateLegend = function() {
	this.svg.select('.legend-box').remove();
	this.svg.selectAll('.legendElement').remove();
	this.addLegend();
}

chart.prototype.addToolTip = function() {
	var that = this;
	//add tooltip to body
	var tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
	var toolLine =  this.chart.append('line').attr('class', 'toolLine');
	var format1d = d3.format('.0f');
	var xFormat = this.options.xAxisFormat != "text" ? d3.format(this.options.xAxisFormat ? this.options.xAxisFormat : "d") : function(x) {return x;} ;
	var yFormat = d3.format(this.options.yAxisFormat ? this.options.yAxisFormat : "d");
	var toolTipFormat = d3.format(this.options.toolTipFormat ? this.options.toolTipFormat : "d");
	
	var tipBox = this.svg.append("rect")
			.attr('class', 'toolTipBox')
			.attr("opacity", 0)
			.attr("width", that.width - (that.margin.left + that.margin.right))
			.attr("height", that.height - ( that.margin.top + that.margin.bottom))
			.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
			.on("mouseover", function() { tooltip.style("display", null); toolLine.style("stroke", null); })
			.on("mouseout", function() { tooltip.style("display", "none"); toolLine.style("stroke", "none"); })
			.on("mousemove", scalePointPosition);
			
	function scalePointPosition() {
			
			var tipText = [];
			var mouse = d3.mouse(this);
			
			//line tool tip text
			that.plotLayers.forEach(function(d,i) {			
				var key = d.label;
				var color = d.color;
				var values = d.data;
				
				var x_var = d.mapping.x_var;
				var y_var = d.mapping.y_var;
				var toolTip_var = d.mapping.toolTip;
				
				var xPos =  that.xScale.invert(mouse[0]);
				var bisect = d3.bisector(function(d) {return d[x_var]; }).left;
				var idx = bisect(values, xPos);

				var d0 = values[idx-1];
				var d1 = values[idx];
				var v = xPos - d0[x_var] > d1[x_var] - xPos ? d1 : d0;	

				var finalObject = {
					color: color,
					x_var: x_var,
					y_var: y_var,
					toolTip_var: toolTip_var,
					values: v
				}
				tipText.push(finalObject);
			});
			
	console.log(tipText);
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
		.style("left", (d3.mouse(this)[0]) + 'px')
		.style("top", 0 + 'px')
		.html(function() { 
			if(tipText[0].toolTip_var){			
				return tipText[0].x_var + ": " + xFormat(tipText[0].values[tipText[0].x_var]) + '<br>' + 
				tipText[0].y_var + ": " + yFormat(tipText[0].values[tipText[0].y_var]) + '<br>' +
				tipText[0].toolTip_var + ": " + toolTipFormat(tipText[0].values[tipText[0].toolTip_var])
			  } else {
				return tipText[0].x_var + ": " + xFormat(tipText[0].values[tipText[0].x_var]) + '<br>' + 
				tipText[0].y_var + ": " + yFormat(tipText[0].values[tipText[0].y_var])
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
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.processScales(this.plotLayers);
	console.log('final_check: ' + this.x_check);
	
	if(this.x_check ){
		
	} else {
		if(this.plotLayers[0].type != "gauge"){
		this.plot
			.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	} else {
		this.plot
			.attr('transform','translate('+this.width/2+','+this.height/2+')');
	}
	
	//update all the other stuff
	this.options.referenceLine = x.options.referenceLine;
	if(this.plotLayers[0].type == "gauge")this.draw();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.processScales(this.plotLayers);
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.updateAxes();
	this.routeLayers();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.addReferenceLines();
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "gauge"){
			this.updateLegend();
		}		
	} 
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap"&
       this.plotLayers[0].type != "gauge" &	   
	   this.plotLayers[0].type != "bar" )this.updateToolTip();
	this.removeLayers(oldLayers);
	}
	
	
	
	
}

chart.prototype.resize = function(){
	var that = this;
	
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	if(this.plotLayers[0].type != "gauge"){
		this.plot 
			.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	} else {
		this.plot 
			.attr('transform','translate('+this.width/2+','+this.height/2+')');
	}
	
	this.clipPath
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
	
	if(this.plotLayers[0].type == "gauge")this.draw();
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.processScales(this.plotLayers);
	if(this.plotLayers[0].type != "treemap"& this.plotLayers[0].type != "gauge")this.updateAxes();
	this.routeLayers();
	if(this.options.suppressLegend == false){
		if(this.plotLayers[0].type != "hexbin" & 
		   this.plotLayers[0].type != "treemap"& 
		   this.plotLayers[0].type != "gauge"){
			this.updateLegend();
		}		
	} 
	if(this.plotLayers[0].type != "hexbin" & 
	   this.plotLayers[0].type != "treemap"&
       this.plotLayers[0].type != "gauge" &	   
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

