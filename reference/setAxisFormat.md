# setAxisFormat()

Sets axis for x axis, y axis, and/or tool tip

## Usage

``` r
setAxisFormat(
  myIO,
  xAxis = "s",
  yAxis = "s",
  toolTip = "s",
  xLabel = NULL,
  yLabel = NULL
)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xAxis:

  a string indicating a d3.js format

- yAxis:

  a string indicating a d3.js format

- toolTip:

  a string indicating a d3.js format

- xLabel:

  a string label for axis

- yLabel:

  a string label for axis

## Value

the same myIO object with options set for the tooltip formats

## Examples

``` r
# Set axis formats using d3.js format strings
myIO() |> setAxisFormat(xAxis = ".0f", yAxis = ".1f")

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":".0f","yAxisFormat":".1f","toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
# Set axis labels
myIO() |> setAxisFormat(xLabel = "Weight (lbs)", yLabel = "MPG")

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":"Weight (lbs)","yAxisLabel":"MPG","toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
```
