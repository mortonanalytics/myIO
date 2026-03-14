import { getRenderer, getRendererForLayer } from "./registry.js";
import { addButtons as addInteractionButtons } from "./interactions/buttons.js";
import { bindPointDrag } from "./interactions/drag.js";
import { bindRollover } from "./interactions/rollover.js";
import { deriveChartRender, applyDerivedScales } from "./derive/chart-render.js";
import { createBins as createBinsImpl, processScales as processScalesImpl } from "./derive/scales.js";
import { transitionGrouped, transitionStacked, getGroupedDataObject } from "./renderers/groupedBarHelpers.js";
import { syncAxes, addAxes as addAxesImpl, updateAxes as updateAxesImpl } from "./layout/axes.js";
import { syncLegend, updateLegend as updateLegendImpl, updateOrdinalColorLegend as updateOrdinalColorLegendImpl, updateContinuousColorLegend as updateContinuousColorLegendImpl } from "./layout/legend.js";
import { syncReferenceLines, updateReferenceLines as updateReferenceLinesImpl } from "./layout/reference-lines.js";
import { getChartHeight, initializeScaffold, updateScaffoldLayout } from "./layout/scaffold.js";
import { initializeTooltip } from "./tooltip.js";
import { isMobile, tagName } from "./utils/responsive.js";

export class myIOchart {
	
	constructor(opts) {
		this.element = opts.element;
		this.plotLayers = opts.plotLayers;
		this.options = opts.options;
		this.margin = this.options.margin;
		this.totalWidth = Math.max(opts.width, 280);
		this.width = !isMobile(this) && this.options.suppressLegend == false ? this.totalWidth * 0.8 : this.totalWidth;
		this.height = opts.height;
		this.draw();
    }
	
	get opts(){
		return this.options;
	}
	
	set opts(x){
		this.options = x ;
	}
	
	draw(){		
		initializeScaffold(this);
		this.initialize();
	}
	
	initialize(){
		this.currentLayers = this.plotLayers;
		
		this.addButtons(this.currentLayers);
		initializeTooltip(this);
			
		if (this.currentLayers.length > 0) {
			this.setClipPath( this.currentLayers[0].type );
		}

		this.renderCurrentLayers({ isInitialRender: true });
	}

	renderCurrentLayers(opts){
		var options = opts || {};
		var state = deriveChartRender(this);

		applyDerivedScales(this, state);
		syncAxes(this, state, options);

		this.routeLayers(this.currentLayers);
		syncReferenceLines(this, state, options);
		syncLegend(this, state);
		bindRollover(this);
	}
	
	addButtons(lys){
		addInteractionButtons(this, lys);
	}
	
	toggleVarY(newY){
		this.newY = newY[0];
		this.newScaleY = newY[1]
		this.processScales(this.currentLayers);
		this.updateAxes();
		this.routeLayers(this.currentLayers);
		bindRollover(this, this.currentLayers);
		if(this.options.suppressLegend == false) this.updateLegend();
	}

	toggleGroupedLayout(lys){
		var data = getGroupedDataObject(lys, this);
		var colors = lys.map(function(layer) {
			return layer.color;
		});
		var bandwidth = ((this.width - (this.margin.right + this.margin.left)) / (data[0].length + 1)) / colors.length;

		if (this.layout === "stacked") {
			transitionGrouped(this, data, colors, bandwidth);
			this.layout = "grouped";
		} else {
			transitionStacked(this, data, colors, bandwidth);
			this.layout = "stacked";
		}
	}
	
	setClipPath(type){
		
		switch (type){
			case "donut":
			case "gauge":
				
				break;
			
			default:
				var chartHeight = getChartHeight(this);
				
				this.clipPath = this.chart.append('defs').append('svg:clipPath')
					.attr('id', this.element.id + 'clip')
				  .append('svg:rect')
					.attr('x', 0)
					.attr('y', 0)
					.attr('width', this.width - (this.margin.left + this.margin.right))
					.attr('height', chartHeight - (this.margin.top + this.margin.bottom));
				
				this.chart.attr('clip-path', 'url(#' + this.element.id + 'clip'+ ')')
		}
		
	}
	
	createBins(lys){
		createBinsImpl(this, lys);
	}
	
	processScales(lys){
		processScalesImpl(this, lys);
	}
	
	addAxes(){
		addAxesImpl(this);
	}
	
	updateAxes(){
		updateAxesImpl(this);
	}
	
	routeLayers(lys){
		var that = this;
	
		this.layerIndex = this.plotLayers.map(function(d) {return d.label; });
		
		lys.forEach(function(d){
			var renderer = getRendererForLayer(d);

			if (renderer && typeof renderer.render === "function") {
				renderer.render(that, d, lys);
			}
		});
	}
	
	removeLayers(lys){
		var elementId = this.element.id;
		var tagPrefixes = ["line", "bar", "point", "regression-line", "hexbin", "area", "crosshairY", "crosshairX"];
	
		lys.forEach(function(d) {
			tagPrefixes.forEach(function(prefix) {
				d3.selectAll("." + tagName(prefix, elementId, d)).transition().duration(500).style('opacity', 0).remove();
			});
		});
	}
	
	dragPoints(ly){
		bindPointDrag(this, ly);
	}
	
	updateRegression(color, label){		
		getRenderer("regression").renderFromPoints(this, color, label);
	}
	
	updateReferenceLines(){
		updateReferenceLinesImpl(this);
	}
	
	updateLegend(){
		updateLegendImpl(this);
	}
	
	updateOrdinalColorLegend(ly){
		updateOrdinalColorLegendImpl(this, ly);
	}
	
	updateContinuousColorLegend(){
		updateContinuousColorLegendImpl(this);
	}
	
	updateChart(x) {
		this.options = x.options;
		
		this.plotLayers = x.layers;
		this.currentLayers = this.plotLayers;
		var newLayers = x.layers.map( d => d.label );
		var oldLayers = [];
		this.layerIndex.forEach(function(d){
				var x = newLayers.indexOf(d);
				if(x < 0) {
					oldLayers.push(d);
					}
			});
			
		this.renderCurrentLayers();
		this.removeLayers(oldLayers);
	}
	
	resize(width, height){
		
		this.totalWidth = Math.max(width, 280);
		this.width = !isMobile(this) && this.options.suppressLegend == false ? this.totalWidth * 0.8 : this.totalWidth;
		this.height = height;
		
		updateScaffoldLayout(this);
		
		var buttons2Use = d3.select(this.element).select(".buttonDiv").selectAll('.button').data(); 
		
		d3.select(this.element).select(".buttonDiv")  
			.style("left", ( this.width - ( 40 + ( 40*buttons2Use.length ) ) ) + 'px')
			.style("top", '0px');	
		
		
		this.renderCurrentLayers();
		
	}
}
