import { getChartHeight } from "../layout/scaffold.js";

const X_DOMAIN_BUFFER = 0.05;
const Y_DOMAIN_BUFFER = 0.15;

export function createBins(chart, lys) {
  var m = chart.margin;
  var chartHeight = getChartHeight(chart);
  var x_extents = [];

  lys.forEach(function(d) {
    var x = d3.extent(d.data, function(e) {
      return +e[d.mapping.value];
    });
    x_extents.push(x);
  });

  var x_min = d3.min(x_extents, function(d) {
    return d[0];
  });
  var x_max = d3.max(x_extents, function(d) {
    return d[1];
  });

  var x = d3.scaleLinear()
    .domain([x_min, x_max]).nice()
    .range([0, chart.width - (m.left + m.right)]);

  lys.forEach(function(d) {
    var values = d.data.map(function(e) {
      return e[d.mapping.value];
    });
    d.bins = d3.bin()
      .domain(x.domain())
      .thresholds(x.ticks(d.mapping.bins))(values);
    d.max_value = d3.max(d.bins, function(bin) {
      return bin.length;
    });
  });

  chart.derived.xScale = x;
  chart.derived.yScale = d3.scaleLinear()
    .domain([0, d3.max(lys, function(d) {
      return d.max_value;
    })]).nice()
    .range([chartHeight - (m.top + m.bottom), 0]);
}

export function processScales(chart, lys) {
  var m = chart.margin;
  var x_extents = [];
  var y_extents = [];
  var x_bands = [];
  var y_bands = [];

  lys.forEach(function(d) {
    var currentY = chart.newY ? chart.newY : d.mapping.y_var;
    var x_var = d.mapping.x_var;
    var y_var = currentY;
    var low_y = d.mapping.low_y;
    var high_y = d.mapping.high_y;
    var x = d3.extent(d.data, function(e) {
      return +e[x_var];
    });
    var y = d3.extent(d.data, function(e) {
      return +e[y_var];
    });
    var y1 = d3.extent(d.data, function(e) {
      return +e[low_y];
    });
    var y2 = d3.extent(d.data, function(e) {
      return +e[high_y];
    });

    x_extents.push(x);
    y_extents.push([d3.min([y[0], y1[0], y2[0]]), d3.max([y[1], y1[1], y2[1]])]);
    x_bands.push(d.data.map(function(e) {
      return e[x_var];
    }));
    y_bands.push(d.data.map(function(e) {
      return e[y_var];
    }));
  });

  var x_min = d3.min(x_extents, function(d) { return d[0]; });
  var x_max = d3.max(x_extents, function(d) { return d[1]; });
  var x_check1 = d3.min(x_extents, function(d) { return d[0]; });
  var x_check2 = d3.max(x_extents, function(d) { return d[1]; });
  chart.derived.xCheck = x_check1 === 0 && x_check2 === 0;

  if (x_min == x_max) {
    x_min = x_min - 1;
    x_max = x_max + 1;
  }

  var x_buffer = Math.max(Math.abs(x_max - x_min) * X_DOMAIN_BUFFER, 0.5);
  var xExtent = [
    chart.config.scales.xlim.min ? +chart.config.scales.xlim.min : x_min - x_buffer,
    chart.config.scales.xlim.max ? +chart.config.scales.xlim.max : x_max + x_buffer
  ];

  chart.derived.xBanded = [].concat.apply([], x_bands).map(function(d) {
    try { return Array.isArray(d) ? d[0] : d; } catch (err) { return void 0; }
  }).filter(onlyUnique);

  var y_min = d3.min(y_extents, function(d) { return d[0]; });
  var y_max = d3.max(y_extents, function(d) { return d[1]; });
  if (y_min == y_max) {
    y_min = y_min - 1;
    y_max = y_max + 1;
  }

  var y_buffer = Math.abs(y_max - y_min) * Y_DOMAIN_BUFFER;
  var yExtent = [
    chart.config.scales.ylim.min ? +chart.config.scales.ylim.min : y_min - y_buffer,
    chart.config.scales.ylim.max ? +chart.config.scales.ylim.max : y_max + y_buffer
  ];

  chart.derived.yBanded = [].concat.apply([], y_bands).map(function(d) {
    try { return Array.isArray(d) ? d[0] : d; } catch (err) { return void 0; }
  }).filter(onlyUnique);

  var chartHeight = getChartHeight(chart);

  switch (chart.config.scales.categoricalScale.xAxis) {
    case true:
      chart.derived.xScale = d3.scaleBand()
        .range([0, chart.width - (m.left + m.right)])
        .domain(chart.config.scales.flipAxis === true ? chart.derived.yBanded : chart.derived.xBanded);
      break;
    case false:
      chart.derived.xScale = d3.scaleLinear()
        .range([0, chart.width - (m.right + m.left)])
        .domain(chart.config.scales.flipAxis === true ? yExtent : xExtent);
  }

  switch (chart.config.scales.categoricalScale.yAxis) {
    case true:
      chart.derived.yScale = d3.scaleBand()
        .range([chartHeight - (m.top + m.bottom), 0])
        .domain(chart.config.scales.flipAxis === true ? chart.derived.xBanded : chart.derived.yBanded);
      break;
    case false:
      chart.derived.yScale = d3.scaleLinear()
        .range([chartHeight - (m.top + m.bottom), 0])
        .domain(chart.config.scales.flipAxis === true ? xExtent : yExtent);
  }

  if (chart.config.scales.colorScheme && chart.config.scales.colorScheme.enabled) {
    chart.derived.colorDiscrete = d3.scaleOrdinal()
      .range(chart.config.scales.colorScheme.colors)
      .domain(chart.config.scales.colorScheme.domain);
    chart.derived.colorContinuous = d3.scaleLinear()
      .range(chart.config.scales.colorScheme.colors)
      .domain(chart.config.scales.colorScheme.domain);
  }
  chart.syncLegacyAliases();
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
