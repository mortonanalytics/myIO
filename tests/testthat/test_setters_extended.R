# Extended tests for setter functions

# --- setTheme ---

test_that("setTheme sets all theme properties", {
  w <- myIO::setTheme(myIO::myIO(), text_color = "white", grid_color = "#333", bg = "#1a1a2e", font = "monospace")
  expect_equal(w$x$config$theme[["chart-text-color"]], "white")
  expect_equal(w$x$config$theme[["chart-grid-color"]], "#333")
  expect_equal(w$x$config$theme[["chart-bg"]], "#1a1a2e")
  expect_equal(w$x$config$theme[["chart-font"]], "monospace")
})

test_that("setTheme removes NULL properties", {
  w <- myIO::setTheme(myIO::myIO(), text_color = "red")
  expect_equal(w$x$config$theme[["chart-text-color"]], "red")
  expect_null(w$x$config$theme[["chart-grid-color"]])
  expect_null(w$x$config$theme[["chart-bg"]])
})

test_that("setTheme supports extra custom properties via ...", {
  w <- myIO::setTheme(myIO::myIO(), "ref-line-color" = "yellow", "legend-inactive-opacity" = "0.3")
  expect_equal(w$x$config$theme[["chart-ref-line-color"]], "yellow")
  expect_equal(w$x$config$theme[["chart-legend-inactive-opacity"]], "0.3")
})

# --- suppressAxis ---

test_that("suppressAxis sets both axes", {
  w <- myIO::suppressAxis(myIO::myIO(), xAxis = TRUE, yAxis = TRUE)
  expect_true(w$x$config$layout$suppressAxis$xAxis)
  expect_true(w$x$config$layout$suppressAxis$yAxis)
})

test_that("suppressAxis sets only x axis", {
  w <- myIO::suppressAxis(myIO::myIO(), xAxis = TRUE)
  expect_true(w$x$config$layout$suppressAxis$xAxis)
  expect_null(w$x$config$layout$suppressAxis$yAxis)
})

test_that("suppressAxis with no args sets NULL values", {
  w <- myIO::suppressAxis(myIO::myIO())
  expect_null(w$x$config$layout$suppressAxis$xAxis)
  expect_null(w$x$config$layout$suppressAxis$yAxis)
})

# --- suppressLegend ---

test_that("suppressLegend sets the flag", {
  w <- myIO::suppressLegend(myIO::myIO())
  expect_true(w$x$config$layout$suppressLegend)
})

# --- dragPoints ---

test_that("dragPoints enables drag interaction", {
  w <- myIO::dragPoints(myIO::myIO())
  expect_true(w$x$config$interactions$dragPoints)
})

test_that("dragPoints can be disabled", {
  w <- myIO::dragPoints(myIO::myIO(), dragPoints = FALSE)
  expect_false(w$x$config$interactions$dragPoints)
})

# --- setMargin ---

test_that("setMargin sets individual margins", {
  w <- myIO::setMargin(myIO::myIO(), top = 10, bottom = 20, left = 30, right = 40)
  expect_equal(w$x$config$layout$margin$top, 10)
  expect_equal(w$x$config$layout$margin$bottom, 20)
  expect_equal(w$x$config$layout$margin$left, 30)
  expect_equal(w$x$config$layout$margin$right, 40)
})

test_that("setMargin uses function defaults for unspecified margins", {
  w <- myIO::setMargin(myIO::myIO(), top = 100)
  expect_equal(w$x$config$layout$margin$top, 100)
  # setMargin defaults: bottom=40, left=50, right=50
  expect_equal(w$x$config$layout$margin$bottom, 40)
})

# --- setAxisFormat ---

test_that("setAxisFormat sets labels", {
  w <- myIO::setAxisFormat(myIO::myIO(), xLabel = "Time", yLabel = "Value")
  expect_equal(w$x$config$axes$xAxisLabel, "Time")
  expect_equal(w$x$config$axes$yAxisLabel, "Value")
})

test_that("setAxisFormat sets tooltip format", {
  w <- myIO::setAxisFormat(myIO::myIO(), toolTip = ".2f")
  expect_equal(w$x$config$axes$toolTipFormat, ".2f")
})

# --- setAxisLimits ---

test_that("setAxisLimits sets partial limits", {
  w <- myIO::setAxisLimits(myIO::myIO(), xlim = list(min = 0, max = 100))
  expect_equal(w$x$config$scales$xlim$min, 0)
  expect_equal(w$x$config$scales$xlim$max, 100)
  expect_null(w$x$config$scales$ylim$min)
})

# --- setTransitionSpeed ---

test_that("setTransitionSpeed updates speed", {
  w <- myIO::setTransitionSpeed(myIO::myIO(), speed = 500)
  expect_equal(w$x$config$transitions$speed, 500)
})

test_that("setTransitionSpeed with zero disables animation", {
  w <- myIO::setTransitionSpeed(myIO::myIO(), speed = 0)
  expect_equal(w$x$config$transitions$speed, 0)
})

# --- setColorScheme ---

test_that("setColorScheme with multiple colors", {
  w <- myIO::setColorScheme(myIO::myIO(), colorScheme = list("red", "green", "blue"), setCategories = c("A", "B", "C"))
  expect_equal(length(w$x$config$scales$colorScheme$colors), 3)
  expect_equal(length(w$x$config$scales$colorScheme$domain), 3)
  expect_true(w$x$config$scales$colorScheme$enabled)
})

# --- setReferenceLines ---

test_that("setReferenceLines sets only x reference", {
  w <- myIO::setReferenceLines(myIO::myIO(), xRef = 42)
  expect_equal(w$x$config$referenceLines$x, 42)
  expect_equal(w$x$config$referenceLines$y, 0)
})

test_that("setReferenceLines sets only y reference", {
  w <- myIO::setReferenceLines(myIO::myIO(), yRef = 99)
  expect_equal(w$x$config$referenceLines$x, 0)
  expect_equal(w$x$config$referenceLines$y, 99)
})

# --- defineCategoricalAxis ---

test_that("defineCategoricalAxis sets x only", {
  w <- myIO::defineCategoricalAxis(myIO::myIO(), xAxis = TRUE)
  expect_true(w$x$config$scales$categoricalScale$xAxis)
  expect_false(w$x$config$scales$categoricalScale$yAxis)
})

test_that("defineCategoricalAxis sets y only", {
  w <- myIO::defineCategoricalAxis(myIO::myIO(), xAxis = FALSE, yAxis = TRUE)
  expect_false(w$x$config$scales$categoricalScale$xAxis)
  expect_true(w$x$config$scales$categoricalScale$yAxis)
})

# --- setToggle ---

test_that("setToggle stores variable and format", {
  w <- myIO::setToggle(myIO::myIO(), variable = "pct", format = ".0%")
  expect_equal(w$x$config$interactions$toggleY$variable, "pct")
  expect_equal(w$x$config$interactions$toggleY$format, ".0%")
})

# --- setToolTipOptions ---

test_that("setToolTipOptions suppressY works", {
  w <- myIO::setToolTipOptions(myIO::myIO(), suppressY = TRUE)
  expect_true(w$x$config$interactions$toolTipOptions$suppressY)
})

test_that("setToolTipOptions suppressY can be FALSE", {
  w <- myIO::setToolTipOptions(myIO::myIO(), suppressY = FALSE)
  expect_false(w$x$config$interactions$toolTipOptions$suppressY)
})

# --- flipAxis ---

test_that("flipAxis sets flipAxis flag", {
  w <- myIO::flipAxis(myIO::myIO())
  expect_true(w$x$config$scales$flipAxis)
})
