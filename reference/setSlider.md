# Add a Parameter Slider (Shiny Only)

Adds a slider control below the chart. Read its Shiny input in the
render expression and pass the value to the transform option to
recompute the chart.

## Usage

``` r
setSlider(myIO, param, label, min, max, value, step = NULL, debounce = 200)
```

## Arguments

- myIO:

  an htmlwidget object created by the
  [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
  function

- param:

  Slider input name (e.g., `"ci_level"`, `"degree"`). Values are sent to
  `` input$`myIO-{outputId}-slider-{param}` ``.

- label:

  display label for the slider

- min:

  minimum value

- max:

  maximum value

- value:

  default value

- step:

  step size (default: `NULL` for auto)

- debounce:

  debounce delay in milliseconds (default: 200)

## Value

A modified `myIO` htmlwidget with slider config attached.

## Examples

``` r
if (FALSE) { # \dontrun{
# In a Shiny server function:
output$chart <- renderMyIO({
  level <- input$`myIO-chart-slider-ci_level`
  if (is.null(level)) level <- 0.95
  myIO(data = mtcars) |>
    addIoLayer(
      type = "regression", label = "fit",
      mapping = list(x_var = "wt", y_var = "mpg"),
      options = list(level = level)
    ) |>
    setSlider("ci_level", "Confidence level", 0.80, 0.99, level, 0.01)
})
} # }
```
