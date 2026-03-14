# setToggle()

Sets toggle options for y_var and adds a toggle button for chart

## Usage

``` r
setToggle(myIO, variable, format = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- variable:

  a string indicating the variable name in data for toggle

- format:

  a string indicating the format for the toggled variable

## Value

the same myIO object

## Examples

``` r
# Add a toggle button to switch y variable
myIO() |> setToggle(variable = "Percent", format = ".0%")

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":"Percent","format":".0%"},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
```
