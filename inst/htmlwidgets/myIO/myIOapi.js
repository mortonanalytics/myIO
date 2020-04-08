class myIOchart {
	
	constructor(opts) {
		this.element = opts.element;
		this.plotLayers = opts.plotLayers;
		this.options = opts.options;
		this.draw();
    }
	
	get opts(){
		return this.options;
	}
	
	set opts(x){
		this.options = x ;
	}
	
	draw(){
		
		//define dimensions
		this.width = this.element.offsetWidth;
		this.height = this.element.offsetHeight;
		this.margin = this.options.margin
		
		//set up parent element and SVG
		this.element.innerHTML = '';
		this.svg = d3.select(this.element).append('svg').attr('id', this.element.id);
		this.svg.attr('width', this.width);
		this.svg.attr('height', this.height);
		
		switch ( this.plotLayers[0].type ) {

			case "gauge":
			this.plot = this.svg.append('g')
				.attr('transform','translate('+this.width/2+','+this.height/2+')')
				.attr('class', 'myIOchart-offset');
			break;
			
			case "donut":
			this.plot = this.svg.append('g')
				.attr('transform','translate('+this.width/2+','+this.height/2+')')
				.attr('class', 'myIOchart-offset');
			break;
			
			default:
			this.plot = this.svg.append('g')
				.attr('transform','translate('+this.margin.left+','+this.margin.top+')')
				.attr('class', 'myIOchart-offset');	
		
		}
		
		this.chart = this.plot
			.append('g')
			.attr('class', 'myIOchart-area');
	
		this.initialize();
	}
	
	initialize(){
		this.addButtons();
		this.setClipPath();
		
		switch ( this.plotLayers[0].type ) {
			case "gauge":
				this.routeLayers(this.plotLayers);
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
				
			case "donut":
				this.routeLayers(this.plotLayers);
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
				
			case "treemap":
				this.routeLayers(this.plotLayers);
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
				
			case "hexbin":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
				
			case "bar":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.updateReferenceLines();
				this.updateLegend();
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
				
			case "line":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.updateReferenceLines();
				this.updateLegend();
				this.updateRollover(this.plotLayers);
				break;
				
			case "point":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.updateReferenceLines();
				this.updateLegend();
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
				break;
			
			case "area":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.updateReferenceLines();
				this.updateLegend();
				this.updateRollover(this.plotLayers);
				break;
				
			case "stat_line":
				this.setZoom();
				this.processScales(this.plotLayers);
				this.addAxes();
				this.routeLayers(this.plotLayers);
				this.updateReferenceLines();
				this.updateLegend();
				this.tooltip = d3.select(this.element).append("div").attr("class", "toolTip");
		}
	}
	
	addButtons(){
		
	}
	
	setClipPath(){
		this.clipPath = this.chart.append('defs').append('svg:clipPath')
			.attr('id', this.element.id + 'clip')
		  .append('svg:rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', this.width - (this.margin.left + this.margin.right))
			.attr('height', this.height - (this.margin.top + this.margin.bottom));
		
		this.chart.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
	}
	
	setZoom(){
		
	}
	
	processScales(lys){
		var that = this;
		var m = this.margin;
		
		var x_extents = [];
		var y_extents = [];
		var x_bands = [];
		var y_bands = [];
		
		
		lys.forEach(function(d){
			var currentY = that.newY ? that.newY : d.mapping.y_var;
			
			var x_var = d.mapping.x_var; 
			var y_var = currentY;
			var low_y = d.mapping.low_y;
			var high_y = d.mapping.high_y;
		
			var x = d3.extent( d.data, function(e) { return +e[x_var]; });
			var y = d3.extent( d.data, function(e) { return +e[y_var]; });
			var y1 = d3.extent( d.data, function(e) { return +e[low_y]; });
			var y2 = d3.extent( d.data, function(e) { return +e[high_y]; });
			
			var final_y_low = d3.min([ y[0], y1[0], y2[0] ]);
			var final_y_high = d3.max([ y[1], y1[1], y2[1] ]);
			var final_y_extent = [final_y_low, final_y_high];
			
			
			var x_cat = d.data.map(function(e) { return e[x_var]; });
			var y_cat = d.data.map(function(e) { return e[y_var]; });

			x_extents.push(x);
			y_extents.push(final_y_extent);
			x_bands.push(x_cat);
			y_bands.push(y_cat);
		})

		//find min and max - X axis
		var x_min = d3.min(x_extents, function(d,i) {return d[0]; });
		var x_max = d3.max(x_extents, function(d,i) {return d[1]; });
		
		//assess if there's any data
		var x_check1 = d3.min(x_extents, function(d,i) {return d[0]; });
		var x_check2 = d3.max(x_extents, function(d,i) {return d[1]; });
		this.x_check = (x_check1 == 0 & x_check2 == 0) == 1;
		
		//prevent single tick on axis
		if(x_min == x_max) { x_min = x_min-1; x_max = x_max+1;}
		
		//calculate buffer
		var x_buffer = Math.max(Math.abs(x_max - x_min) * .05, 0.5) ;
	
		var final_x_min = this.options.xlim.min ? this.options.xlim.min : (x_min - x_buffer) ;
		var final_x_max = this.options.xlim.max ? this.options.xlim.max : (x_max + x_buffer) ;
		var xExtent = [final_x_min, 
					   final_x_max ];
					   
		this.x_banded = [].concat.apply([], x_bands).map(function(d){
			try {
				return d[0];
			}
			
			catch(err) {
				console.log(err.message);
			}
		}).filter(onlyUnique);
					   
		//find min and max - Y axis
		var y_min = d3.min(y_extents, function(d,i) {return d[0]; });
		var y_max = d3.max(y_extents, function(d,i) {return d[1]; });
		
		//prevent single tick on axis
		if(y_min == y_max) { y_min = y_min-1; y_max = y_max+1;}
		
		//calculate buffer
		var y_buffer = Math.abs(y_max - y_min) * .15 ;
		
		//user inputs if available
		var final_y_min = this.options.ylim.min ? this.options.ylim.min : (y_min - y_buffer) ;
		var final_y_max = this.options.ylim.max ? this.options.ylim.max : (y_max + y_buffer) ;
		var yExtent = [(final_y_min), 
					   (final_y_max)];
					   
		this.y_banded = [].concat.apply([], y_bands).map(function(d){
			try {
				return d[0];
			}
			
			catch(err) {
				console.log(err.message);
			}
		}).filter(onlyUnique);
					   
		// create x scale
		switch (this.options.categoricalScale.xAxis){
			case true:
				this.xScale = d3.scaleBand()
					.range([0, this.width - (m.left + m.right)])
					.domain(that.options.flipAxis == true ? this.y_banded : this.x_banded );
				break;
				
			case false:
				this.xScale = d3.scaleLinear()
					.range([0, this.width - (m.right + m.left)])
					.domain(that.options.flipAxis == true ? yExtent : xExtent);
		}
		
		// create y scale
		switch (this.options.categoricalScale.yAxis){
			case true:
				this.yScale = d3.scaleBand()
					.range([this.height - (m.top + m.bottom), 0])
					.domain(that.options.flipAxis == true ? this.x_banded : this.y_banded );
				break;
				
			case false:
				this.yScale = d3.scaleLinear()
					.range([this.height - (m.top + m.bottom), 0])
					.domain(that.options.flipAxis == true ? xExtent : yExtent);
		}
		
		// if there is a color scheme defined
		if(this.options.colorScheme){
			this.colorDiscrete = d3.scaleOrdinal()
				.range( this.options.colorScheme[0] )
				.domain( this.options.colorScheme[1] );
			
			this.colorContinuous = d3.scaleLinear()
				.range( this.options.colorScheme[0] )
				.domain( this.options.colorScheme[1] );
		}
		
		//helper function(s)
		function onlyUnique(value, index, self) { 
			return self.indexOf(value) === index;
		}
	}
	
	addAxes(){
		var that = this;
		var m = this.margin;
		
		switch (this.options.xAxisFormat){
			case "yearMon":
				var xFormat = d3.format("s");
				break;
			
			default:
				var xFormat = d3.format(this.options.xAxisFormat);
			
		}
		
		var yFormat = d3.format(this.options.yAxisFormat);
		
		switch (this.options.categoricalScale.xAxis){
			case true:
			this.plot.append('g')
				.attr("class", "x axis")
				.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
				.call(d3.axisBottom(this.xScale))
					.selectAll("text")
					.attr("dx", "-.25em")
					.attr('text-anchor', this.width < 550 ? 'end' : 'center')
					.attr("transform", this.width < 550 ? "rotate(-65)" : "rotate(-0)");
			break;
			
			case false:
				this.plot.append('g')
					.attr("class", "x axis")
					.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
					.call(d3.axisBottom(this.xScale)
							.ticks(this.width < 550 ? 5 : 10, xFormat)
							//.tickFormat(function(e){ if(Math.floor(+e) != +e){return;} return +e;})
							.tickSize( -(this.height-(m.top+m.bottom)) )
								)
						.selectAll("text")
							.attr('dy', '1.25em')
							.attr('text-anchor', this.width < 550 ? 'end' : 'center')
							.attr("transform", this.width < 550 ? "rotate(-65)" : "rotate(-0)");
			
		}
		
		var currentFormatY = this.newScaleY ? this.newScaleY : yFormat;
		
		this.plot.append('g')
			.attr("class", "y axis")
			.call(d3.axisLeft(this.yScale)
				.ticks(this.height < 450 ? 5 : 10, currentFormatY)
				.tickSize( -this.width-(m.right+m.left) )
				)
			.selectAll("text")
				.attr("dx", "-.25em");
	}
	
	updateAxes(){
		var that = this;
		var m = this.margin;
		
		var transitionSpeed = this.options.transition.speed;
		
		switch (this.options.xAxisFormat){
			case "yearMon":
				var xFormat = d3.format("s");
				break;
			
			default:
				var xFormat = d3.format(this.options.xAxisFormat);
			
		}
		
		var yFormat = d3.format(this.options.yAxisFormat);
		
		switch (this.options.categoricalScale.xAxis){
			case true:
				this.svg.selectAll('.x.axis')
					.transition().ease(d3.easeQuad)
					.duration(transitionSpeed)
					.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
					.call(d3.axisBottom(this.xScale))
						.selectAll("text")
						.attr("dx", "-.25em")
						.attr('text-anchor', this.width < 550 ? 'end' : 'center')
						.attr("transform", this.width < 550 ? "rotate(-65)" : "rotate(-0)");
			break;
			
			case false:
				this.svg.selectAll('.x.axis')
					.transition().ease(d3.easeQuad)
					.duration(transitionSpeed)
					.attr("transform", "translate(0," + (this.height-(m.top+m.bottom)) + ")")
						.call(d3.axisBottom(this.xScale)
								.ticks(this.width < 550 ? 5 : 10, xFormat)
								.tickSize( -(this.height-(m.top+m.bottom)) )
								//.tickFormat(function(e){ if(Math.floor(+e) != +e){return;} return +e;})
									)
							.selectAll("text")
								.attr('dy', '1.25em')
								.attr('text-anchor', this.width < 550 ? 'end' : 'center')
								.attr("transform", this.width < 550 ? "rotate(-65)" : "rotate(-0)");
			
		}
		
		var currentFormatY = this.newScaleY ? this.newScaleY : yFormat;
		
		this.svg.selectAll('.y.axis')
			.transition().ease(d3.easeQuad)
			.duration(transitionSpeed)
			.call(d3.axisLeft(this.yScale)
				.ticks(this.height < 450 ? 5 : 10, currentFormatY)
				.tickSize( -(this.width-(m.right+m.left)) )
				)				
			.selectAll("text")
				.attr("dx", "-.25em");
		
	}
	
	routeLayers(lys){
		var that = this;
	
		this.layerIndex = this.plotLayers.map(function(d) {return d.label; });
		
		lys.forEach(function(d){
			
			var layerType = d.type;
			
			switch (layerType){
				case "line":
					that.addLine(d);
					that.addPoints(d);
					break;
				
				case "point":
					that.addPoints(d);
					break;
				
				case "area":
					that.addArea(d);
					break;
					
				case "bar":
					that.options.flipAxis == true ? that.addHorizontalBars(d): that.addVerticalBars(d);
					break;
					
				case "hexbin":
					that.addHexBins(d);
					break;
					
				default:
				
			}
			
		});
	}
	
	removeLayers(lys){
		var that = this;
	
		lys.forEach(function(d) {
			
			d3.selectAll( '.tag-line-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-bar-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-point-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-regression-line-' + that.element.id + '-'  + d.replace(/\s+/g, '') ).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-hexbin-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-area-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-crosshairY-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
			d3.selectAll( '.tag-crosshairX-' + that.element.id + '-'  + d.replace(/\s+/g, '')).transition().duration(500).style('opacity', 0).remove() ;
		})
	}
	
	addLine(ly){
		var that = this;
		
		var data = ly.data;
		var key = ly.label;
		
		var currentY = this.newY ? this.newY : ly.mapping.y_var;
		
		var transitionSpeed = this.options.transition.speed;
		
		var valueLine = d3.line()
			.curve(d3.curveMonotoneX)
			.x(d => this.xScale( d[ly.mapping.x_var] ) )
			.y(d => this.yScale( d[ currentY ] ) );
	
		var linePath = this.chart
			.selectAll( '.tag-line-' + this.element.id + '-'  + key.replace(/\s+/g, '')) 
			.data([data]);
		
		//EXIT old elements not present in new data
		linePath.exit()
		  .transition().duration(transitionSpeed).style('opacity', 0)
			.remove();
		
		//ENTER new elements present in new data
		var newLinePath = linePath.enter().append("path")
			.attr("fill", "none")
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.style('stroke', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[ly.mapping.group]) : ly.color )
			.style("stroke-width", 3)
			.style('opacity', 0)
			.attr("class", 'tag-line-' + this.element.id + '-'  + key.replace(/\s+/g, '') );
			
		//UPDATE old elements present in new data
		linePath.merge(newLinePath)	
		  .transition()
		  .ease(d3.easeQuad)
		  .duration(transitionSpeed)
			.style('opacity', 1)
			.style('stroke',d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[0][ly.mapping.group]) : ly.color )
			.attr("d", valueLine);
	}
	
	addPoints(ly){
		
		var transitionSpeed = this.options.transition.speed;
		
		//join data to points
		var points = this.chart
			.selectAll( '.tag-point-' + this.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
			.data(ly.data);

		points.exit()
		  .transition().remove();
		
		points
		  .transition()
		  .ease(d3.easeQuad)
		  .duration(transitionSpeed)
			.style('fill', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[ly.mapping.group]) : ly.color )
			.attr('cx', e => this.xScale( e[ly.mapping.x_var] ) )
			.attr('cy', e => this.yScale( e[ this.newY ? this.newY : ly.mapping.y_var ] ) );
		
		points.enter()
			.append('circle')
			.attr('r', 5)
			.style('fill', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[ly.mapping.group]) : ly.color )
			.style('opacity', 0)
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.attr('cx', e => this.xScale( e[ly.mapping.x_var] ) )
			.attr('cy', e => this.yScale( e[ this.newY ? this.newY : ly.mapping.y_var ] ) )
			.attr("class", 'tag-point-' + this.element.id + '-' + ly.label.replace(/\s+/g, '')  )
		  .transition()
			.ease(d3.easeQuad)
			.duration(transitionSpeed)
			.style('opacity', 1);
		
		if(this.options.dragPoints == true) { 
			this.dragPoints(ly); 
			var color = this.options.colorScheme[2] == "on" ? this.colorScheme(ly.data[ly.mapping.group]) : ly.color; 
			setTimeout( () => this.updateRegression(color, ly.label), transitionSpeed );
		}
	}
	
	addArea(ly){
		var that = this;
	
		var data = ly.data;
		var key = ly.label;
		var transitionSpeed = this.options.transition.speed;
		
		var valueArea = d3.area()
			.curve(d3.curveMonotoneX)
			.x(d => this.xScale( d[ ly.mapping.x_var ] ) )
			.y0(d => this.yScale( d[ ly.mapping.low_y ] ) )
			.y1(d => this.yScale( d[ ly.mapping.high_y ] ) );
			
		var linePath = this.chart
			.selectAll( '.tag-area-' + this.element.id + '-'  + key.replace(/\s+/g, '')) 
			.data([data]);
		
		//EXIT old elements not present in new data
		linePath.exit()
		  .transition().duration(transitionSpeed).style('opacity', 0)
			.remove();
		
		//ENTER new elements present in new data
		var newLinePath = linePath.enter().append("path")
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.style('fill', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[0][ly.mapping.group]) : ly.color )
			.style('opacity', 0)
			.attr("class", 'tag-area-' + this.element.id + '-'  + key.replace(/\s+/g, '') );
			
		//UPDATE old elements present in new data
		linePath.merge(newLinePath)
			.attr('clip-path', 'url(#' + this.element.id + 'clip' + ')')
		  .transition()
			.ease(d3.easeQuad)
			.duration(transitionSpeed)
			.attr("d", valueArea)
			.style('opacity', 0.4);
	}

	addVerticalBars(ly){
		var that = this;
		var m = this.margin;
		var data = ly.data;
		var key = ly.label;
		var barSize = ly.options.barSize == "small" ? 0.5 : 1;
		var bandwidth = this.options.categoricalScale.xAxis == true ? (this.width - (m.left + m.right)) / that.x_banded.length : Math.min(100, (that.width - (that.margin.right + that.margin.left)) / ly.data.length);
		var transitionSpeed = this.options.transition.speed;
		
		var bars = this.chart
			.selectAll('.tag-bar-' + this.element.id + '-'  + key.replace(/\s+/g, ''))
			//.selectAll('rect')
			.data(data);
		
		bars.exit()
			.transition().duration(transitionSpeed).attr('y', this.yScale(0))
			.remove();
		
		var newBars = bars.enter()
			.append('rect')
			.attr('class', 'tag-bar-' + this.element.id + '-'  + key.replace(/\s+/g, ''))
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.style('fill', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[ly.mapping.x_var]) : ly.color )
			.attr('x', d => defineScale(d,ly,bandwidth, barSize, this.options.categoricalScale.xAxis) )
			.attr('y', this.yScale(0))
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', this.height -( m.top + m.bottom ))
			.on('mouseover', hoverTip)
			.on('mousemove', hoverTip)
			.on('mouseout', hoverTipHide);
			
		bars.merge(newBars)
			.transition()
			.ease(d3.easeQuad)
			.duration(transitionSpeed)
			.attr('x', d => defineScale(d, ly, bandwidth, barSize, this.options.categoricalScale.xAxis) )
			.attr('y', d => this.yScale(d[ly.mapping.y_var]) )
			.attr('width', (barSize * bandwidth)-2)
			.attr('height', d => (this.height -( m.top + m.bottom )) - this.yScale(d[ly.mapping.y_var]) );
			
		function hoverTip(){
			
		}
		
		function hoverTipHide(){
			
		}
		
		function defineScale(d,ly, bandwidth, barSize, scale){
			switch (scale){
				case true:
					return barSize == 1 ? that.xScale(d[ly.mapping.x_var]) : that.xScale(d[ly.mapping.x_var]) + (bandwidth/4) ;
					break;
				default:
					return barSize == 1 ? that.xScale(d[ly.mapping.x_var]) - (bandwidth/2) : that.xScale(d[ly.mapping.x_var]) - (bandwidth/4);
			}
		}
	}
	
	addHorizontalBars(ly){
		
		var that = this;
		var m = this.margin;
		var data = ly.data;
		var key = ly.label;
		var barSize = ly.options.barSize == "small" ? 0.5 : 1;
		var bandwidth = this.options.categoricalScale.yAxis == true ? (this.height - (m.top + m.bottom)) / ly.data.length : Math.min(100, (this.height - (this.margin.top + this.margin.bottom)) / ly.data.length);
		var transitionSpeed = this.options.transition.speed;
		
		var bars = this.chart
			.selectAll('.tag-bar-' + this.element.id + '-'  + key.replace(/\s+/g, ''))
			//.selectAll('rect')
			.data(data);
		
		bars.exit()
			.transition().duration(transitionSpeed).attr('width', 0)
			.remove();
		
		var newBars = bars.enter()
			.append('rect')
			.attr('class', 'tag-bar-' + this.element.id + '-'  + key.replace(/\s+/g, ''))
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.style('fill', d => this.options.colorScheme[2] == "on" ? this.colorScheme(d[ly.mapping.x_var]) : ly.color )
			.attr('y', d => barSize == 1 ? this.yScale(d[ly.mapping.x_var]) : this.yScale(d[ly.mapping.x_var]) + bandwidth/4 )
			.attr('x', d => this.xScale(Math.min(0, d[ly.mapping.y_var])) )
			.attr('height', (barSize * bandwidth)-2)
			.attr('width', 0)
			.on('mouseover', hoverTip)
			.on('mousemove', hoverTip)
			.on('mouseout', hoverTipHide);
			
		bars.merge(newBars)
			.transition()
			.ease(d3.easeQuad)
			.duration(transitionSpeed)
			.attr('y', d => barSize == 1 ? this.yScale(d[ly.mapping.x_var]) : this.yScale(d[ly.mapping.x_var]) + bandwidth/4 )
			.attr('x', d => this.xScale(Math.min(0, d[ly.mapping.y_var])) )
			.attr('height', (barSize * bandwidth)-2)
			.attr('width', d => Math.abs(this.xScale(d[ly.mapping.y_var]) - this.xScale(0)) );
			
		function hoverTip(){
			
		}
		
		function hoverTipHide(){
			
		}
		
		function defineScale(d,ly, bandwidth, barSize, scale){
			switch (scale){
				case true:
					return barSize == 1 ? that.yScale(d[ly.mapping.y_var]) : that.yScale(d[ly.mapping.y_var]) + (bandwidth/4) ;
					break;
				default:
					return barSize == 1 ? that.yScale(d[ly.mapping.y_var]) - (bandwidth/2) : that.yScale(d[ly.mapping.y_var]) - (bandwidth/4);
			}
		}
	}
	
	addHexBins(ly){
		var that = this;
		var transitionSpeed = this.options.transition.speed;

		//create points	
		var points = ly.data.map(function(d) { return  { 0: that.xScale(+d[ly.mapping.x_var]), 1: that.yScale(+d[ly.mapping.y_var]) } ; });
		points = points.sort(function(d) { return d3.ascending(d.index); });
		var x_extent = d3.extent(ly.data, function(d) { return +d[ly.mapping.x_var]; })
		var y_extent = d3.extent(ly.data, function(d) { return +d[ly.mapping.y_var]; })
			
		//hexbin function
		var hexbin = d3.hexbin()
			.radius(ly.mapping.radius * (Math.min(this.width, this.height) / 1000 ))
			.extent([
				[x_extent[0], y_extent[0]],
				[x_extent[1], y_extent[1]]
			]);
			
		var binnedData = hexbin(points);
		
		//color scale
		var color = d3.scaleSequential(d3.interpolateBuPu)
		 .domain([0, d3.max(binnedData, d => d.length) / 2])
				
		//data join
		var bins = this.chart
			.attr('clip-path', 'url(#' + that.element.id + 'clip'+ ')')
			.selectAll( '.tag-hexbin-' + that.element.id + '-'  +ly.label.replace(/\s+/g, '')) 
			.data(binnedData);
		
		//EXIT
		bins.exit()
		  .transition()
			.duration(transitionSpeed)
			.remove();
		  
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
				.duration(transitionSpeed)
			.attr('d', hexbin.hexagon())
			.attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.attr('fill', function(d) { return color(d.length); });
	}
	
	dragPoints(ly){
		const that = this;
		
		
	
		var drag = d3.drag()
			.on('start', dragStart)
			.on('drag', dragging)
			.on('end', dragEnd);
		
		this.chart
			.selectAll('.tag-point-' + that.element.id + '-'  +ly.label.replace(/\s+/g, ''))
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

			that.updateRegression(color, ly.label);
			
			if(HTMLWidgets.shinyMode) {
				const x = points.map(function(d){return d['x_var']; });
				const y = points.map(function(d){return d['y_var']; });
				const est = points.map(function(d){return d['y_est']; });
			
				Shiny.onInputChange('myIOpointsX-'  + label.replace(/\s+/g, ''), x);
				Shiny.onInputChange('myIOpointsY-'  + label.replace(/\s+/g, ''), y);
				Shiny.onInputChange('myIOpointsEst-'  + label.replace(/\s+/g, ''), est);
			}
			
		}

	}
	
	updateRegression(color, label){		
		var that = this;
		var transitionSpeed = this.options.transition.speed;
		
		//define line function
		var valueLine = d3.line()
			.x(d => this.xScale(d.x_var) )
			.y(d => this.yScale(d.y_est));
		
		var points = [];
		
		this.chart
			.selectAll('.tag-point-' + this.element.id + '-'  + label.replace(/\s+/g, ''))
			.each(function(){
				var x = that.xScale.invert(this.getAttribute('cx'));
				var y = that.yScale.invert(this.getAttribute('cy'));	
				var point = {
					x_var:x,
					y_var:y
				}
				points.push(point)
			});
			
		//regress points
		var regression = linearRegression(points, "y_var", "x_var");
		
		if(HTMLWidgets.shinyMode) {
			Shiny.onInputChange('myIOregression-'  + label.replace(/\s+/g, ''), regression);
		}
		
		points.forEach(function(d){
		 d.y_est = regression.fn(d.x_var);
		});
		
		var finalPoints = points
			.sort(function(a,b){ return a.x_var - b.x_var; })
			.filter(function(d, i){
				return i === 0 || i === (points.length - 1);
			});
		
		//data join regressed points
		var linePath = this.chart
			.selectAll( '.tag-regression-line-' + this.element.id + '-'  + label.replace(/\s+/g, '') )
			.data([finalPoints]);
		
		//EXIT old elements not present in new data
		linePath.exit()
		  .transition()
		  .duration(transitionSpeed)
			.style('opacity', 0)
			.remove();
		
		//ENTER new elements present in new data
		var newLinePath = linePath
		  .enter().append("path")
			.attr("class", 'tag-regression-line-'+ this.element.id + '-'  + label.replace(/\s+/g, '') )
			.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
			.style("fill", "none")
			.style('stroke', color )
			.style("stroke-width", 3)
			.style('opacity', 0)
			;
			
		//UPDATE old elements present in new data
		linePath.merge(newLinePath)	
		  .transition()
		  .ease(d3.easeQuad)
		  .duration(transitionSpeed)
			.style('opacity', 1)
			.style('stroke', color )
			.attr("d", valueLine);
			
		function linearRegression(data,y_var,x_var){
			console.log("regression run");
			const x = data.map(function(d) { return d[x_var]; });
			const y = data.map(function(d) { return d[y_var]; });
			
			const lr = {};
			const n = y.length;
			let sum_x = 0;
			let sum_y = 0;
			let sum_xy = 0;
			let sum_xx = 0;
			let sum_yy = 0;
			
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
	}
	
	updateReferenceLines(){
		
	}
	
	updateLegend(){
		var that = this;
		var m = this.margin;
		
		d3.select(this.element).select('.legend-box').remove();
		d3.select(this.element).selectAll('.legendElement').remove();
		
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
			.attr("transform", d => "translate(0," +  (75 + labelIndex.indexOf(d)* 20) + ")" )
			.attr("font-family", "sans-serif")
			.attr("font-size", 10)
			.attr("text-anchor", "end")
			.on('click', toggleLine);
		
		switch (d.type){
			case "line":
				legendElement.append("rect")
					.attr("x", that.width - 12)
					.attr('y', 5)
					.attr("width", 12)
					.attr("height", 12)
					.attr("fill", d.color)
					.attr("stroke", d.color);
				break;
			case "point":
				legendElement.append("circle")
					.attr("cx", that.width - 5)
					.attr('cy', 6)
					.attr('r', 5)
					.attr("fill", d.color)
					.attr("stroke", d.color);
				break;
			
			default:
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
			.text( d => d );
			
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
		
			that.processScales(filteredLayers);
			that.routeLayers(filteredLayers);
			that.removeLayers(removedLayers);
			that.updateAxes();
			//that.addToolTip(filteredLayers);
			//that.addButtons();
		
		}
	}
	
	updateRollover(lys){
		
	}
	
	resize(){
		
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
		this.routeLayers(this.plotLayers);
		
		if(this.svg.selectAll('.legendElement').data().length > 0) this.updateLegend();
	}
}

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

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function (callback, type, quality) {
      var dataURL = this.toDataURL(type, quality).split(',')[1];
      setTimeout(function() {

        var binStr = atob( dataURL ),
            len = binStr.length,
            arr = new Uint8Array(len);

        for (var i = 0; i < len; i++ ) {
          arr[i] = binStr.charCodeAt(i);
        }

        callback( new Blob( [arr], {type: type || 'image/png'} ) );

      });
    }
  });
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