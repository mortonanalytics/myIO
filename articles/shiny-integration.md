# Shiny Integration

## Overview

myIO provides standard `htmlwidgets` Shiny bindings, so charts work like
any other output in your Shiny app. This vignette covers the basics,
interactive I/O patterns, and common recipes.

## Minimal App

Use
[`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
in the UI and
[`renderMyIO()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
in the server:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("myIO + Shiny"),
  myIOOutput("chart", width = "100%", height = "400px")
)

server <- function(input, output) {
  output$chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "steelblue",
        label = "scatter",
        data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      )
  })
}

shinyApp(ui, server)
```

## Reactive Data

Because
[`renderMyIO()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
is reactive, the chart updates automatically when inputs change. Use
standard Shiny reactivity to filter or transform data:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("Reactive myIO Chart"),
  sidebarLayout(
    sidebarPanel(
      selectInput("cyl", "Cylinders:",
        choices = c("All", sort(unique(mtcars$cyl))),
        selected = "All"
      ),
      selectInput("chart_type", "Chart Type:",
        choices = c("point", "bar", "line"),
        selected = "point"
      )
    ),
    mainPanel(
      myIOOutput("chart", height = "500px")
    )
  )
)

server <- function(input, output) {
  filtered_data <- reactive({
    if (input$cyl == "All") mtcars else mtcars[mtcars$cyl == as.numeric(input$cyl), ]
  })

  output$chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = input$chart_type,
        color = "#E69F00",
        label = "data",
        data = filtered_data(),
        mapping = list(x_var = "wt", y_var = "mpg")
      ) |>
      setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon") |>
      setMargin(top = 20, bottom = 70, left = 60, right = 10)
  })
}

shinyApp(ui, server)
```

## Brush Selection

[`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md)
enables rectangle selection on a chart. The selected data points are
available as a Shiny reactive input:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("Brush Selection"),
  fluidRow(
    column(8, myIOOutput("chart", height = "400px")),
    column(4,
      h4("Selected Points"),
      verbatimTextOutput("selected")
    )
  )
)

server <- function(input, output) {
  output$chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "#4E79A7",
        label = "scatter",
        data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      ) |>
      setBrush() |>
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })

  output$selected <- renderPrint({
    brushed <- input$`myIO-chart-brushed`
    if (is.null(brushed)) return("Drag to select points")
    sel <- jsonlite::fromJSON(brushed)
    if (length(sel$keys) == 0) return("No points selected")
    paste(length(sel$keys), "points selected")
  })
}

shinyApp(ui, server)
```

The brush input key follows the pattern `myIO-{outputId}-brushed`. The
payload includes:

- `data` — array of selected row objects
- `keys` — `_source_key` values for each selected point
- `extent` — brush bounds in data coordinates

Use `direction = "x"` or `direction = "y"` for single-axis brushing.

## Click-to-Annotate

[`setAnnotation()`](https://mortonanalytics.github.io/myIO/reference/setAnnotation.md)
enables click-to-label mode. Each annotation is stored as structured
data and available as a Shiny reactive:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("Data Annotation"),
  fluidRow(
    column(8, myIOOutput("chart", height = "400px")),
    column(4,
      h4("Annotations"),
      tableOutput("annotations")
    )
  )
)

server <- function(input, output) {
  output$chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "#4E79A7",
        label = "scatter",
        data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      ) |>
      setAnnotation(
        labels = c("outlier", "interesting", "normal"),
        colors = c(outlier = "#E63946", interesting = "#F4A261", normal = "#2A9D8F")
      ) |>
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })

  output$annotations <- renderTable({
    ann <- input$`myIO-chart-annotated`
    if (is.null(ann)) return(data.frame())
    parsed <- jsonlite::fromJSON(ann)
    if (length(parsed$annotations) == 0) return(data.frame())
    parsed$annotations[, c("label", "x", "y", "category")]
  })
}

shinyApp(ui, server)
```

The annotation input key is `myIO-{outputId}-annotated`. Each annotation
includes `_source_key`, `x`, `y`, `label`, `category` (color), and
`timestamp`.

## Linked Brushing

[`setLinked()`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
connects two or more myIO charts via Crosstalk. Brushing points in one
chart highlights them in the other:

``` r

library(shiny)
library(myIO)
library(crosstalk)

ui <- fluidPage(
  titlePanel("Linked Brushing"),
  fluidRow(
    column(6, myIOOutput("scatter1", height = "350px")),
    column(6, myIOOutput("scatter2", height = "350px"))
  )
)

server <- function(input, output) {
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))

  output$scatter1 <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "#4E79A7",
        label = "wt vs mpg",
        data = shared$data(),
        mapping = list(x_var = "wt", y_var = "mpg")
      ) |>
      setBrush() |>
      setLinked(shared, mode = "source") |>
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })

  output$scatter2 <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "#E15759",
        label = "hp vs mpg",
        data = shared$data(),
        mapping = list(x_var = "hp", y_var = "mpg")
      ) |>
      setLinked(shared, mode = "target") |>
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG")
  })
}

shinyApp(ui, server)
```

Both charts share the same `SharedData` object. The `mode` parameter
controls direction: `"source"` emits selections, `"target"` receives
them, and `"both"` (default) does both.

Set `filter = TRUE` to hide non-matching points instead of dimming them.

## Parameter Sliders

[`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md)
adds a slider below the chart that sends its value as a Shiny input.
This is useful for adjusting transform parameters (confidence level,
smoothing span, polynomial degree) without building a separate sidebar:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("Interactive Regression"),
  myIOOutput("chart", height = "450px")
)

server <- function(input, output) {
  output$chart <- renderMyIO({
    ci <- input$`myIO-chart-slider-ci_level` %||% 0.95

    myIO(data = mtcars) |>
      addIoLayer(
        type = "regression",
        label = "fit",
        mapping = list(x_var = "wt", y_var = "mpg"),
        options = list(method = "lm", showCI = TRUE, level = ci)
      ) |>
      setSlider("ci_level", "Confidence Level", 0.80, 0.99, ci, 0.01) |>
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })
}

shinyApp(ui, server)
```

The slider input key is `myIO-{outputId}-slider-{param}`. Use `debounce`
to control how often the slider fires (default 200ms).

## Multiple Charts

Add multiple
[`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
calls to display several charts side by side. Each chart gets its own
output ID:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  titlePanel("Multiple Charts"),
  fluidRow(
    column(6, myIOOutput("scatter", height = "350px")),
    column(6, myIOOutput("bars", height = "350px"))
  )
)

server <- function(input, output) {
  output$scatter <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "#56B4E9",
        label = "scatter",
        data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      ) |>
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })

  output$bars <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "bar",
        color = "#E69F00",
        label = "bars",
        data = mtcars,
        mapping = list(x_var = "cyl", y_var = "mpg")
      ) |>
      defineCategoricalAxis(xAxis = TRUE) |>
      setAxisFormat(xLabel = "Cylinders", yLabel = "MPG")
  })
}

shinyApp(ui, server)
```

## Theming in Shiny

Theme tokens from
[`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md)
work the same way in Shiny:

``` r

library(shiny)
library(myIO)

ui <- fluidPage(
  style = "background-color: #1a1a2e; color: #e0e0e0;",
  titlePanel("Dark Mode Dashboard"),
  myIOOutput("chart", height = "400px")
)

server <- function(input, output) {
  output$chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "line",
        color = c("#48dbfb", "#ff6b6b", "#feca57", "#ff9ff3", "#00d2ff"),
        label = "Month",
        data = within(airquality, Month <- paste0("M", Month)),
        mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
      ) |>
      setTheme(
        text_color = "#b0b0b0",
        grid_color = "#2d2d2d",
        bg = "#1a1a2e",
        font = "Inter, system-ui, sans-serif"
      ) |>
      setAxisFormat(xLabel = "Day", yLabel = "Temperature")
  })
}

shinyApp(ui, server)
```

## Sizing

[`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
accepts `width` and `height` as CSS units. Charts are responsive by
default and will adapt to their container:

``` r

# Fixed size
myIOOutput("chart1", width = "600px", height = "400px")

# Fill container width
myIOOutput("chart2", width = "100%", height = "500px")
```

## Shiny Input Reference

All myIO Shiny inputs follow the naming pattern
`myIO-{outputId}-{event}`:

| Input key | Event | Payload |
|----|----|----|
| `myIO-{id}-rollover` | Hover on data element | JSON data point |
| `myIO-{id}-dragEnd` | Point drag completed | JSON `{ point, layerLabel }` |
| `myIO-{id}-brushed` | Brush selection | JSON `{ data, extent, keys, active }` |
| `myIO-{id}-annotated` | Annotation added/removed | JSON `{ annotations, action }` |
| `myIO-{id}-slider-{param}` | Slider value changed | Numeric value |
| `myIO-{id}-error` | Render error | Error message string |

## Tips

- **Transitions**: Use `setTransitionSpeed(speed = 0)` to disable
  animations if the chart updates frequently from reactive inputs.
- **Export**: Charts include built-in CSV and SVG export buttons that
  work in Shiny without extra configuration.
- **Drag points**:
  [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md)
  enables interactive point dragging. In a Shiny context, you can use
  this for exploratory what-if analysis.
- **Brush + annotation**: Both can be active simultaneously. Clicks on
  data points open the annotation popover; dragging on empty space
  activates the brush.
- **Slider debounce**: For heavy transforms, increase the debounce:
  `setSlider("span", "Span", 0.1, 1.0, 0.5, debounce = 500)`.

## Deep Dive

For a comprehensive walkthrough with the live demo app embedded, see the
package documentation at
[`vignette("shiny-integration", package = "myIO")`](https://mortonanalytics.github.io/myIO/articles/shiny-integration.md).
