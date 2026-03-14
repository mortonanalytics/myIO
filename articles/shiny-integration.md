# Shiny Integration

## Overview

myIO provides standard `htmlwidgets` Shiny bindings, so charts work like
any other output in your Shiny app. This vignette covers the basics and
common patterns.

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
work the same way in Shiny. This makes it easy to match your chart to
the app’s look and feel:

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

## Tips

- **Transitions**: Use `setTransitionSpeed(speed = 0)` to disable
  animations if the chart updates frequently from reactive inputs.
- **Export**: Charts include built-in CSV and SVG export buttons that
  work in Shiny without extra configuration.
- **Drag points**:
  [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md)
  enables interactive point dragging. In a Shiny context, you can use
  this for exploratory what-if analysis.
