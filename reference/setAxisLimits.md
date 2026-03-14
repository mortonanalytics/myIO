# setAxisLimits()

Sets margins for the top, bottom, left, and right sides of the chart

## Usage

``` r
setAxisLimits(
  myIO,
  xlim = list(min = NULL, max = NULL),
  ylim = list(min = NULL, max = NULL)
)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xlim:

  a list of min and max values

- ylim:

  a list of min and max values

## Value

the same myIO object

## Examples

``` r
# Set x axis limits
myIO() |> setAxisLimits(xlim = list(min = 0, max = 100))

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":0,"max":100},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
# Set both axis limits
myIO() |> setAxisLimits(
  xlim = list(min = 0, max = 50),
  ylim = list(min = -10, max = 200)
)

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":0,"max":50},"ylim":{"min":-10,"max":200},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
```
