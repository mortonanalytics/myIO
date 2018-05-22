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
	this.margin = { top: 20, right: 100, bottom: 40, left: 40};
	
	//set up parent element and SVG
	this.element.innerHTML = '';
	this.svg = d3.select(this.element).append('svg');
	this.svg.attr('width', this.width);
	this.svg.attr('height', this.height);
	
	//create g element
	this.plot = this.svg.append('g')
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
				
	this.chart = this.plot.append('g');
	
	//initialize chart
	this.initialize();
	
}

chart.prototype.initialize = function(){
	
	this.setClipPath();
	//this.setZoom();
	this.processScales(this.plotLayers);
	this.addAxes();
	this.routeLayers();
	this.addReferenceLines();
	this.addLegend();
	if(this.plotLayers[0].type != "hexbin") {this.addToolTip();}
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
	var m = this.margin;
	
	var x_extents = [];
	var y_extents = [];
	
	lys.forEach(function(d){
		
		const x_var = d.mapping.x_var; 
		const y_var = d.mapping.y_var;
		
		const x = d3.extent( d.data, function(e) { return +e[x_var]; });
		const y = d3.extent( d.data, function(e) { return +e[y_var]; });
		
		x_extents.push(x);
		y_extents.push(y);
	})
	
	var x_min = d3.min(x_extents, function(d,i) {return d[0]; });
	var x_max = d3.max(x_extents, function(d,i) {return d[1]; });
	if(x_min == x_max) { x_min = x_min-1; x_max = x_max+1;}
	var x_buffer = Math.abs(x_max - x_min) * .05 ;
	var xExtent = [x_min-x_buffer, x_max + x_buffer];
	
	var y_min = d3.min(y_extents, function(d,i) {return d[0]; });
	var y_max = d3.max(y_extents, function(d,i) {return d[1]; });
	if(y_min == y_max) { y_min = y_min-1; y_max = y_max+1;}
	var y_buffer = Math.abs(y_max - y_min) * .15 ;
	var yExtent = [(y_min-y_buffer), (y_max+y_buffer)];
	
	//create scales
	this.xScale = d3.scaleLinear()
		.range([0, this.width - (m.right + m.left)])
		.domain(xExtent);
	
	this.yScale =  d3.scaleLinear()
		.range([this.height - (m.top + m.bottom), 0])
		.domain(yExtent);
	
}

chart.prototype.addAxes = function(){
	
	var m = this.margin;
	
	//create and append axes
	this.plot.append('g')
		.attr("class", "x axis")
		.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
		.call(d3.axisBottom(this.xScale))
			.selectAll("text")
				.attr('dy', '.35em')
				.attr('text-anchor', 'center');
	//console.log(this.yScale.domain());
	this.plot.append('g')
		.attr("class", "y axis")
		.call(d3.axisLeft(this.yScale).ticks(null, "s"))
			.selectAll("text")
				.attr("dx", "-.25em");
				
}

chart.prototype.updateAxes = function() {
	
	var that = this;
	var m = this.margin;
	
	//console.log(this.yScale.domain());
	this.svg.selectAll('.x.axis')
		.transition().ease(d3.easeQuad)
		.duration(500)
		.attr("transform", "translate(0," + (that.height-(m.top+m.bottom)) + ")")
		.call(d3.axisBottom(this.xScale))
			.selectAll("text")
				.attr('dy', '.35em')
				.style('text-anchor', 'center');
	
	this.svg.selectAll('.y.axis')
		.transition().ease(d3.easeQuad)
		.duration(500)
		.call(d3.axisLeft(this.yScale).ticks(null, "s"))
			.selectAll("text")
				.attr("dx", "-.25em");
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
		} else {alert("Wrong Layer Type! Can be: line, point, stat_line")}
		
	})
	
}

chart.prototype.removeLayers = function(lys){
	//removes garbage if the layer no longer exists and isn't otherwise updated
	var that = this;
	
	lys.forEach(function(d) {
		console.log(d);
		d3.selectAll( '.tag-line-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-point-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-hexbin-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-area-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-crosshairY-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		d3.selectAll( '.tag-crosshairX-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
	})
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
	console.log(bins);	
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
		.attr('fill', function(d) { return color(d.length); });
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
				.attr("x", that.width - 10)
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
				.attr("x", that.width - 10)
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
				console.log(d.mapping.x_var);
				var x_var = d.mapping.x_var;
				var y_var = d.mapping.y_var;
				
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
		
	tooltip.html(tipText[0].values[tipText[0].x_var])
		.style('display', 'inline-block')
		.style('opacity', 0.9)
		.style("left", (d3.mouse(this)[0]) + 'px')
		.style("top", 0 + 'px')
		.selectAll(".tip-text")
		.data(tipText).enter()
		.append('div')
		.style('color', function(d) { return d.color; })
		.html(function(d) { return d.y_var + ": " + format1d(d.values[d.y_var]); });
	}
}

chart.prototype.updateToolTip = function() {
	
	var that = this;
	
	var tipBox = d3.select(this.element).select('.toolTipBox')
			.attr("width", that.width - (that.margin.left + that.margin.right))
			.attr("height", that.height - ( that.margin.top + that.margin.bottom))
			.attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");
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
	
	this.plot
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	//update all the other stuff
	this.options.referenceLine = x.options.referenceLine;
	
	this.processScales(this.plotLayers);
	this.updateAxes();
	this.routeLayers();
	this.addReferenceLines();
	this.updateLegend();
	this.updateToolTip();
	this.removeLayers(oldLayers);
	
}

chart.prototype.resize = function(){
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	
	this.svg
		.attr('width', this.width)
		.attr('height', this.height);
	
	this.plot
		.attr('transform','translate('+this.margin.left+','+this.margin.top+')');
	
	this.clipPath
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', this.width - (this.margin.left + this.margin.right))
		.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
	this.processScales(this.plotLayers);
	this.updateAxes();
	this.routeLayers();
	this.updateLegend();
	this.updateToolTip();
}
