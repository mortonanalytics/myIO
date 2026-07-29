# Sequential Storytelling with Keyframes

Keyframes turn a chart into a short sequence of named data states. The
chart uses its first registered frame initially. With two or more
frames, myIO adds a separate previous, play/pause, and next control
surface with the active label. Playback advances once, waits one second
after each transition, and stops at the final frame.

## A single-layer story

Build the layer first, then register each state with
[`addKeyframe()`](https://mortonanalytics.github.io/myIO/reference/addKeyframe.md).
A data frame is accepted directly when the chart has exactly one
serialized layer.

``` r

start <- data.frame(year = 2024:2026, value = c(18, 22, 25))
growth <- data.frame(year = 2024:2026, value = c(18, 28, 39))
outlook <- data.frame(year = 2024:2026, value = c(18, 31, 48))

myIO(start) |>
  addIoLayer(
    type = "line", label = "Revenue", color = "#4E79A7",
    mapping = list(x_var = "year", y_var = "value")
  ) |>
  addKeyframe(start, "Baseline") |>
  addKeyframe(growth, "Growth case") |>
  addKeyframe(outlook, "Outlook") |>
  setTransition(duration = 500, easing = "cubic") |>
  setAxisFormat(xLabel = "Year", yLabel = "Revenue")
```

Labels must be unique, non-empty strings. Registering a keyframe before
any layer exists is an error, as is passing a data frame after the chart
has more than one serialized layer.

## Complete multi-layer snapshots

For a multi-layer chart, pass a named list keyed by existing layer
labels. Each stored keyframe is a complete snapshot. If a frame omits a
layer, that layer retains its data from the preceding frame.

``` r

actual_1 <- data.frame(month = 1:3, value = c(10, 13, 17))
actual_2 <- data.frame(month = 1:4, value = c(10, 13, 17, 22))
target_1 <- data.frame(month = 1:3, value = c(12, 15, 18))
target_2 <- data.frame(month = 1:4, value = c(12, 15, 18, 21))

myIO() |>
  addIoLayer(
    type = "line", label = "Actual", data = actual_1,
    mapping = list(x_var = "month", y_var = "value")
  ) |>
  addIoLayer(
    type = "line", label = "Target", data = target_1,
    mapping = list(x_var = "month", y_var = "value")
  ) |>
  addKeyframe(
    list(Actual = actual_1, Target = target_1),
    "Quarter opening"
  ) |>
  addKeyframe(
    list(Actual = actual_2),
    "Latest actuals"
  ) |>
  addKeyframe(
    list(Actual = actual_2, Target = target_2),
    "Revised target"
  )
```

The `Target` layer in `Latest actuals` carries forward from
`Quarter opening`. Unknown layer names, unnamed lists, non-data-frame
values, and duplicate frame labels fail in R before a widget is
serialized.

## Transforms are applied per frame

Keyframe inputs are source data. myIO applies the layer’s configured R
transform before storing the snapshot, exactly as it does when the layer
is created.

``` r

observed <- data.frame(x = 1:20, y = (1:20) + sin(1:20))
projected <- data.frame(x = 1:20, y = (1:20) * 1.4 + cos(1:20))

myIO(observed) |>
  addIoLayer(
    type = "line", label = "Trend", transform = "lm",
    mapping = list(x_var = "x", y_var = "y")
  ) |>
  addKeyframe(observed, "Observed trend") |>
  addKeyframe(projected, "Projected trend")
```

## Select and step from Shiny

The proxy methods use the same chart instance registry as
[`updateMyIOData()`](https://mortonanalytics.github.io/myIO/reference/myIOProxy.md).
[`setKeyframe()`](https://mortonanalytics.github.io/myIO/reference/setKeyframe.md)
accepts a unique label or a one-based index. Steps clamp at the first
and final frames.

``` r

ui <- shiny::fluidPage(
  myIOOutput("story"),
  shiny::actionButton("next_frame", "Next"),
  shiny::actionButton("show_baseline", "Baseline")
)

server <- function(input, output, session) {
  output$story <- renderMyIO({
    myIO(start) |>
      addIoLayer("line", label = "Revenue",
        mapping = list(x_var = "year", y_var = "value")) |>
      addKeyframe(start, "Baseline") |>
      addKeyframe(growth, "Growth case") |>
      addKeyframe(outlook, "Outlook")
  })

  shiny::observeEvent(input$next_frame, {
    myIOProxy("story", session) |> stepKeyframe("next")
  })
  shiny::observeEvent(input$show_baseline, {
    myIOProxy("story", session) |> setKeyframe("Baseline")
  })
}

shiny::shinyApp(ui, server)
```

## Motion, accessibility, and export

Buttons support normal keyboard activation, show a visible focus
indicator, and announce the active label through a polite live region.
The controls wrap on narrow containers and are excluded from print and
chart exports.

`setTransition(duration = 0)` renders each state immediately. The same
zero-duration behavior is applied when the viewer requests reduced
motion; manual stepping and one-pass playback remain available in both
cases. Timers are cleared on pause, widget re-render, and destruction.
Legend visibility, brush, zoom, and toggle state are preserved because
frame changes use the existing in-place data update path.
