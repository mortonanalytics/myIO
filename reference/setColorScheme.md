# setColorScheme()

Sets color scheme for a chart and the category names (optional)

## Usage

``` r
setColorScheme(myIO, colorScheme = NULL, setCategories = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- colorScheme:

  a vector of colors in the order you want them used

- setCategories:

  an optional vector of names that will be mapped to the corresponding
  color in the colorScheme

## Value

the same myIO object

## Examples

``` r
# Set a custom color scheme
myIO() |> setColorScheme(colorScheme = list("red", "blue", "green"))

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["red","blue","green"],"domain":"none","enabled":true}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
# Set colors with category labels
myIO() |> setColorScheme(
  colorScheme = list("steelblue", "orange"),
  setCategories = c("Group A", "Group B")
)

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["steelblue","orange"],"domain":["Group A","Group B"],"enabled":true}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
```
