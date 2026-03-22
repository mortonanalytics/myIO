# E2E tests: build every chart type from app.R and verify payloads + save HTML for visual review

output_dir <- file.path(tempdir(), "myIO_e2e")
dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)

save_widget <- function(w, name) {
  path <- file.path(output_dir, paste0(name, ".html"))
  htmlwidgets::saveWidget(w, path, selfcontained = FALSE)
  path
}

test_that("Grouped Bar renders with correct grouped layers", {
  df <- datasets::airquality
  df$Month <- as.character(df$Month)

  w <- myIO() |>
    addIoLayer(
      type = "groupedBar",
      color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
      label = "Temperature by Month",
      data = df,
      mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
    ) |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)")

  layers <- w$x$config$layers
  expect_true(length(layers) >= 5)
  expect_true(all(sapply(layers, function(l) l$type) == "groupedBar"))
  expect_true(all(sapply(layers, function(l) length(l$data) > 0)))
  save_widget(w, "01_grouped_bar")
})

test_that("Line chart renders with grouped layers", {
  df <- datasets::airquality
  df$Month <- as.character(df$Month)

  w <- myIO() |>
    addIoLayer(
      type = "line",
      color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
      label = "Temp",
      data = df,
      mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
    ) |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature")

  layers <- w$x$config$layers
  expect_true(length(layers) >= 5)
  expect_true(all(sapply(layers, function(l) l$type) == "line"))
  save_widget(w, "02_line")
})

test_that("Point + LM renders with scatter and transformed line layers", {
  df <- datasets::mtcars

  w <- myIO() |>
    addIoLayer(
      type = "point",
      color = "#4E79A7",
      label = "Cars",
      data = df,
      mapping = list(x_var = "wt", y_var = "mpg")
    ) |>
    addIoLayer(
      type = "line",
      transform = "lm",
      color = "#E15759",
      label = "Linear Fit",
      data = df,
      mapping = list(x_var = "wt", y_var = "mpg")
    ) |>
    setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon")

  layers <- w$x$config$layers
  expect_length(layers, 2)
  expect_equal(layers[[1]]$type, "point")
  expect_equal(layers[[2]]$type, "line")
  expect_equal(layers[[2]]$transform, "lm")
  save_widget(w, "03_point_lm")
})

test_that("Bar chart renders with categorical x", {
  df <- data.frame(
    category = c("Alpha", "Beta", "Gamma", "Delta", "Epsilon"),
    value = c(42, 87, 63, 29, 55),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "bar",
      color = "#59A14F",
      label = "Values",
      data = df,
      mapping = list(x_var = "category", y_var = "value")
    ) |>
    defineCategoricalAxis(xAxis = TRUE) |>
    setAxisFormat(yAxis = ".0f", xLabel = "Category", yLabel = "Value")

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "bar")
  expect_length(layers[[1]]$data, 5)
  expect_true(w$x$config$scales$categoricalScale$xAxis)
  save_widget(w, "04_bar")
})

test_that("Horizontal bar renders with flipped axis", {
  df <- data.frame(
    region = c("North", "South", "East", "West", "Central"),
    sales = c(320, 475, 290, 510, 380),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "bar",
      color = "#F28E2B",
      label = "Sales",
      data = df,
      mapping = list(x_var = "region", y_var = "sales")
    ) |>
    defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) |>
    flipAxis() |>
    setAxisFormat(xAxis = ".0f", xLabel = "Sales ($K)", yLabel = "Region")

  expect_true(w$x$config$scales$flipAxis)
  expect_true(w$x$config$scales$categoricalScale$yAxis)
  save_widget(w, "05_horizontal_bar")
})

test_that("Area chart renders with low_y/high_y bands", {
  set.seed(1)
  months <- 1:12
  base <- cumsum(runif(12, 10, 30))
  df <- data.frame(
    month = rep(months, 2),
    low = c(base * 0.85, base * 0.5),
    high = c(base * 1.15, base * 0.8),
    band = rep(c("Optimistic", "Conservative"), each = 12),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "area",
      color = c("#4E79A7", "#F28E2B"),
      label = "Forecast",
      data = df,
      mapping = list(x_var = "month", low_y = "low", high_y = "high", group = "band")
    ) |>
    setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Month", yLabel = "Revenue")

  layers <- w$x$config$layers
  expect_length(layers, 2)
  expect_true(all(sapply(layers, function(l) l$type) == "area"))
  save_widget(w, "06_area")
})

test_that("Histogram renders with value mapping", {
  set.seed(1)
  df <- data.frame(value = rnorm(200, mean = 50, sd = 15))

  w <- myIO() |>
    addIoLayer(
      type = "histogram",
      color = "#76B7B2",
      label = "Distribution",
      data = df,
      mapping = list(value = "value")
    ) |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Value", yLabel = "Count")

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "histogram")
  expect_length(layers[[1]]$data, 200)
  save_widget(w, "07_histogram")
})

test_that("Donut chart renders with segments", {
  df <- data.frame(
    segment = c("Desktop", "Mobile", "Tablet", "Other"),
    traffic = c(45, 35, 15, 5),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "donut",
      color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
      label = "Traffic",
      data = df,
      mapping = list(x_var = "segment", y_var = "traffic")
    )

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "donut")
  expect_length(layers[[1]]$data, 4)
  save_widget(w, "08_donut")
})

test_that("Gauge renders with value", {
  w <- myIO() |>
    addIoLayer(
      type = "gauge",
      color = "#E15759",
      label = "Completion",
      data = data.frame(value = 0.65),
      mapping = list(value = "value")
    ) |>
    suppressAxis(xAxis = TRUE, yAxis = TRUE) |>
    suppressLegend()

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "gauge")
  expect_true(w$x$config$layout$suppressLegend)
  save_widget(w, "09_gauge")
})

test_that("Treemap renders with hierarchy and y_var", {
  df <- data.frame(
    department = c("Eng", "Eng", "Eng", "Sales", "Sales", "Marketing", "Marketing", "Marketing"),
    team = c("Frontend", "Backend", "Infra", "Enterprise", "SMB", "Content", "Paid", "Brand"),
    headcount = c(25, 30, 15, 20, 18, 12, 10, 8),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "treemap",
      color = c("#4E79A7", "#F28E2B", "#E15759"),
      label = "Org Chart",
      data = df,
      mapping = list(level_1 = "department", level_2 = "team", y_var = "headcount")
    )

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "treemap")
  # Treemap data should be a hierarchy with children
  expect_true(!is.null(layers[[1]]$data$children))
  expect_equal(layers[[1]]$data$name, "Org Chart")
  expect_length(layers[[1]]$data$children, 3)
  save_widget(w, "10_treemap")
})

test_that("Hexbin renders with radius mapping", {
  set.seed(42)
  df <- data.frame(
    x = c(rnorm(200, 3, 1), rnorm(200, 7, 1.5)),
    y = c(rnorm(200, 5, 1), rnorm(200, 8, 1.2))
  )

  w <- myIO() |>
    addIoLayer(
      type = "hexbin",
      color = "#4E79A7",
      label = "Density",
      data = df,
      mapping = list(x_var = "x", y_var = "y", radius = 20)
    ) |>
    setAxisFormat(xLabel = "X", yLabel = "Y")

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "hexbin")
  expect_equal(layers[[1]]$mapping$radius, 20)
  expect_length(layers[[1]]$data, 400)
  save_widget(w, "11_hexbin")
})

test_that("Heatmap widget builds with matrix axes", {
  df <- data.frame(
    x = c("A", "B", "A", "B"),
    y = c("Low", "Low", "High", "High"),
    value = c(1, 2, 3, 4),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "heatmap",
      color = "#4E79A7",
      label = "Heat",
      data = df,
      mapping = list(x_var = "x", y_var = "y", value = "value")
    ) |>
    defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE)

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "heatmap")
  save_widget(w, "13_heatmap")
})

test_that("Candlestick widget builds with OHLC data", {
  df <- data.frame(
    x = 1:3,
    open = c(10, 12, 14),
    high = c(15, 16, 18),
    low = c(8, 11, 13),
    close = c(13, 14, 17),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "candlestick",
      color = "#4E79A7",
      label = "Candles",
      data = df,
      mapping = list(x_var = "x", open = "open", high = "high", low = "low", close = "close")
    ) |>
    setAxisFormat(xLabel = "Session", yLabel = "Price")

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "candlestick")
  save_widget(w, "14_candlestick")
})

test_that("Waterfall widget auto-applies the cumulative transform", {
  df <- data.frame(
    step = c("Start", "Add", "Subtract"),
    value = c(100, 25, -10),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "waterfall",
      color = "#59A14F",
      label = "Flow",
      data = df,
      mapping = list(x_var = "step", y_var = "value")
    ) |>
    defineCategoricalAxis(xAxis = TRUE)

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "waterfall")
  expect_equal(layers[[1]]$transform, "cumulative")
  save_widget(w, "15_waterfall")
})

test_that("Sankey widget builds with source-target-value data", {
  df <- data.frame(
    source = c("A", "A", "B"),
    target = c("B", "C", "D"),
    value = c(5, 3, 2),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "sankey",
      color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
      label = "Flow",
      data = df,
      mapping = list(source = "source", target = "target", value = "value")
    )

  layers <- w$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$type, "sankey")
  save_widget(w, "16_sankey")
})

test_that("Boxplot widget expands into primitive layers", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12, 13),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "boxplot",
      color = "#4E79A7",
      label = "Box",
      data = df,
      mapping = list(x_var = "group", y_var = "value"),
      options = list(showOutliers = FALSE)
    ) |>
    defineCategoricalAxis(xAxis = TRUE)

  layers <- w$x$config$layers
  expect_length(layers, 4)
  expect_true(all(sapply(layers, function(l) l$type %in% c("rangeBar", "point"))))
  save_widget(w, "17_boxplot")
})

test_that("Violin widget expands into density and summary layers", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "violin",
      color = "#59A14F",
      label = "Violin",
      data = df,
      mapping = list(x_var = "group", y_var = "value"),
      options = list(showBox = TRUE, showMedian = TRUE, showPoints = FALSE)
    ) |>
    defineCategoricalAxis(xAxis = TRUE)

  layers <- w$x$config$layers
  expect_length(layers, 4)
  expect_true(any(sapply(layers, function(l) l$`_compositeRole` == "density_area")))
  save_widget(w, "18_violin")
})

test_that("Ridgeline widget expands to one density area per group", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO() |>
    addIoLayer(
      type = "ridgeline",
      color = c("#4E79A7", "#F28E2B"),
      label = "Ridge",
      data = df,
      mapping = list(x_var = "value", y_var = "aux", group = "group"),
      options = list(overlap = 0.5)
    ) |>
    setAxisFormat(xLabel = "Value", yLabel = "Density")

  layers <- w$x$config$layers
  expect_length(layers, 2)
  expect_true(all(sapply(layers, function(l) l$type == "area")))
  save_widget(w, "19_ridgeline")
})

test_that("Theme demo renders with custom theme and reference line", {
  df <- datasets::mtcars
  df$cyl <- as.character(df$cyl)

  w <- myIO() |>
    addIoLayer(
      type = "point",
      color = c("#FF6B6B", "#4ECDC4", "#45B7D1"),
      label = "MPG by HP",
      data = df,
      mapping = list(x_var = "hp", y_var = "mpg", group = "cyl")
    ) |>
    setTheme(text_color = "#e0e0e0", grid_color = "#333333", bg = "#1a1a2e", font = "monospace") |>
    setAxisFormat(xLabel = "Horsepower", yLabel = "MPG") |>
    setReferenceLines(yRef = mean(df$mpg))

  expect_equal(w$x$config$theme[["chart-text-color"]], "#e0e0e0")
  expect_equal(w$x$config$theme[["chart-bg"]], "#1a1a2e")
  expect_equal(w$x$config$referenceLines$y, mean(df$mpg))
  save_widget(w, "12_theme_demo")
})

# ---- Statistical augmentation E2E tests ----

test_that("Regression composite renders with scatter + trend + CI + R²", {
  set.seed(42)
  df <- data.frame(x = 1:30, y = 2 * (1:30) + rnorm(30, sd = 3))
  w <- myIO(data = df) |>
    addIoLayer(type = "regression", label = "regression demo",
      mapping = list(x_var = "x", y_var = "y"),
      options = list(method = "lm", showCI = TRUE, showStats = TRUE))
  layers <- w$x$config$layers
  types <- sapply(layers, function(l) l$type)
  expect_true("point" %in% types)
  expect_true("line" %in% types)
  expect_true("area" %in% types)
  expect_true("text" %in% types)
  save_widget(w, "13_regression_composite")
})

test_that("Scatter + lm line + CI band renders via manual composition", {
  df <- data.frame(x = 1:25, y = 3 * (1:25) + rnorm(25, sd = 2))
  w <- myIO(data = df) |>
    addIoLayer(type = "point", label = "scatter",
      mapping = list(x_var = "x", y_var = "y")) |>
    addIoLayer(type = "line", label = "trend", transform = "lm",
      mapping = list(x_var = "x", y_var = "y")) |>
    addIoLayer(type = "area", label = "95% CI", transform = "ci",
      mapping = list(x_var = "x", y_var = "y"))
  expect_equal(length(w$x$config$layers), 3)
  ci_layer <- w$x$config$layers[[3]]
  expect_equal(ci_layer$transform, "ci")
  expect_equal(ci_layer$mapping$low_y, "low_y")
  save_widget(w, "14_scatter_lm_ci")
})

test_that("LOESS smoothing renders", {
  set.seed(42)
  df <- data.frame(x = 1:50, y = sin(seq(0, 4*pi, length.out = 50)) + rnorm(50, sd = 0.3))
  w <- myIO(data = df) |>
    addIoLayer(type = "point", label = "data",
      mapping = list(x_var = "x", y_var = "y")) |>
    addIoLayer(type = "line", label = "loess", transform = "loess",
      mapping = list(x_var = "x", y_var = "y"),
      options = list(span = 0.3))
  expect_equal(length(w$x$config$layers), 2)
  loess_layer <- w$x$config$layers[[2]]
  expect_equal(length(loess_layer$data), 100)
  save_widget(w, "15_loess_smoothing")
})

test_that("Mean ± CI error bars render", {
  df <- data.frame(
    species = rep(c("setosa", "versicolor", "virginica"), each = 20),
    value = c(rnorm(20, 5, 0.5), rnorm(20, 6, 0.6), rnorm(20, 7, 0.7))
  )
  w <- myIO(data = df) |>
    addIoLayer(type = "rangeBar", label = "mean CI", transform = "mean_ci",
      mapping = list(x_var = "species", y_var = "value"),
      options = list(level = 0.95))
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$transform, "mean_ci")
  expect_equal(length(layer$data), 3)
  save_widget(w, "16_mean_ci_errorbars")
})

test_that("Moving average overlay renders", {
  df <- data.frame(x = 1:100, y = cumsum(rnorm(100)))
  w <- myIO(data = df) |>
    addIoLayer(type = "line", label = "raw",
      mapping = list(x_var = "x", y_var = "y")) |>
    addIoLayer(type = "line", label = "SMA-10", transform = "smooth",
      mapping = list(x_var = "x", y_var = "y"),
      options = list(method = "sma", window = 10))
  expect_equal(length(w$x$config$layers), 2)
  save_widget(w, "17_moving_average")
})

test_that("Residual plot renders", {
  set.seed(42)
  df <- data.frame(x = 1:30, y = 2 * (1:30) + rnorm(30, sd = 3))
  w <- myIO(data = df) |>
    addIoLayer(type = "point", label = "residuals", transform = "residuals",
      mapping = list(x_var = "x", y_var = "y")) |>
    setReferenceLines(list(list(axis = "y", value = 0, label = "zero")))
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$transform, "residuals")
  expect_equal(length(layer$data), 30)
  save_widget(w, "18_residual_plot")
})

# Print output directory for visual review
cat("\n\n=== E2E HTML files saved to:", output_dir, "===\n")
cat("Open these in a browser to visually verify each chart type.\n\n")
