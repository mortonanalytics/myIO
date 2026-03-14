# setTheme()

Sets chart theme tokens using CSS custom properties

## Usage

``` r
setTheme(
  myIO,
  text_color = NULL,
  grid_color = NULL,
  bg = NULL,
  font = NULL,
  ...
)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- text_color:

  text and label color

- grid_color:

  grid line color

- bg:

  background color

- font:

  font family

- ...:

  additional CSS custom property overrides without the \`chart-\` prefix

## Value

the same myIO object

## Examples

``` r
myIO() |>
  setTheme(text_color = "#222222", grid_color = "#d9d9d9")

{"x":{"data":null,"config":{"specVersion":1,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":{"chart-text-color":"#222222","chart-grid-color":"#d9d9d9"},"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null}}},"evals":[],"jsHooks":[]}
```
