# Shiny Bindings for myIO

Shiny Bindings for myIO

## Usage

``` r
myIOOutput(outputId, width = "100%", height = "400px")

renderMyIO(expr, env = parent.frame(), quoted = FALSE)
```

## Arguments

- outputId:

  output variable to read from

- width, height:

  Must be a valid CSS unit or a number.

- expr:

  An expression that generates a myIO

- env:

  The environment in which to evaluate `expr`.

- quoted:

  Is `expr` a quoted expression?

## Value

`myIOOutput` returns a Shiny UI element for placement in a UI
definition. `renderMyIO` returns a Shiny render function for use in a
server definition.

## Examples

``` r
if (interactive()) {
  library(shiny)
  ui <- fluidPage(myIOOutput("chart"))
  server <- function(input, output) {
    output$chart <- renderMyIO({
      myIO(data = mtcars) |>
        addIoLayer(type = "point", label = "scatter",
          mapping = list(x_var = "wt", y_var = "mpg"))
    })
  }
  shinyApp(ui, server)
}
```
