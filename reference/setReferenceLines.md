# setReferenceLines()

Sets x and y reference lines

## Usage

``` r
setReferenceLines(myIO, xRef = 0, yRef = 0)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xRef:

  a list of the reference line value of x

- yRef:

  a list of the reference line value of y

## Value

the same myIO object

## Examples

``` r
# Add reference lines at x=5 and y=20
myIO() |> setReferenceLines(xRef = 5, yRef = 20)

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":5,"y":20}}},"evals":[],"jsHooks":[]}
```
