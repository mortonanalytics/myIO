# Add a Parameter Slider (Shiny Only)

Adds a slider control below the chart that adjusts a transform option
and triggers reactive re-rendering in Shiny.

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

  transform option name (e.g., `"ci_level"`, `"degree"`)

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
  myIO(data = mtcars) |>
    addIoLayer(
      type = "regression", label = "fit",
      mapping = list(x_var = "wt", y_var = "mpg"),
      options = list(ci_level = 0.95)
    ) |>
    setSlider("ci_level", "Confidence level", 0.80, 0.99, 0.95, 0.01)
})
} # }
```
