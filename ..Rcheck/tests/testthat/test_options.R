# Tests for option-setting functions

test_that("setAxisFormat sets axis formats", {
  widget <- myIO::myIO()
  widget <- myIO::setAxisFormat(widget, xAxis = ".0f", yAxis = ".1f")
  expect_equal(widget$x$options$xAxisFormat, ".0f")
  expect_equal(widget$x$options$yAxisFormat, ".1f")
})

test_that("setAxisFormat sets tooltip format", {
  widget <- myIO::setAxisFormat(myIO::myIO(), toolTip = ".2f")
  expect_equal(widget$x$options$toolTipFormat, ".2f")
})

test_that("setAxisFormat sets axis labels", {
  widget <- myIO::setAxisFormat(myIO::myIO(),
    xLabel = "Weight", yLabel = "MPG"
  )
  expect_equal(widget$x$options$xAxisLabel, "Weight")
  expect_equal(widget$x$options$yAxisLabel, "MPG")
})

test_that("dragPoints sets option to TRUE", {
  widget <- myIO::dragPoints(myIO::myIO())
  expect_true(widget$x$options$dragPoints)
})

test_that("dragPoints can be set to FALSE", {
  widget <- myIO::dragPoints(myIO::myIO(), dragPoints = FALSE)
  expect_false(widget$x$options$dragPoints)
})

test_that("flipAxis sets option to TRUE", {
  widget <- myIO::flipAxis(myIO::myIO())
  expect_true(widget$x$options$flipAxis)
})

test_that("flipAxis can be set to FALSE", {
  widget <- myIO::flipAxis(myIO::myIO(), flipAxis = FALSE)
  expect_false(widget$x$options$flipAxis)
})

test_that("defineCategoricalAxis sets xAxis to TRUE by default", {
  widget <- myIO::defineCategoricalAxis(myIO::myIO())
  expect_true(widget$x$options$categoricalScale$xAxis)
  expect_false(widget$x$options$categoricalScale$yAxis)
})

test_that("defineCategoricalAxis can set both axes", {
  widget <- myIO::defineCategoricalAxis(myIO::myIO(),
    xAxis = TRUE, yAxis = TRUE
  )
  expect_true(widget$x$options$categoricalScale$xAxis)
  expect_true(widget$x$options$categoricalScale$yAxis)
})

test_that("suppressAxis suppresses x and y axes", {
  widget <- myIO::suppressAxis(myIO::myIO(), xAxis = TRUE, yAxis = TRUE)
  expect_true(widget$x$options$suppressAxis$xAxis)
  expect_true(widget$x$options$suppressAxis$yAxis)
})

test_that("suppressAxis defaults to NULL", {
  widget <- myIO::suppressAxis(myIO::myIO())
  expect_null(widget$x$options$suppressAxis$xAxis)
  expect_null(widget$x$options$suppressAxis$yAxis)
})

test_that("suppressLegend sets option to TRUE", {
  widget <- myIO::suppressLegend(myIO::myIO())
  expect_true(widget$x$options$suppressLegend)
})

test_that("suppressLegend can be set to FALSE", {
  widget <- myIO::suppressLegend(myIO::myIO(), suppressLegend = FALSE)
  expect_false(widget$x$options$suppressLegend)
})

test_that("setmargin sets all margins", {
  widget <- myIO::setmargin(myIO::myIO(),
    top = 100, bottom = 80, left = 60, right = 40
  )
  expect_equal(widget$x$options$margin$top, 100)
  expect_equal(widget$x$options$margin$bottom, 80)
  expect_equal(widget$x$options$margin$left, 60)
  expect_equal(widget$x$options$margin$right, 40)
})

test_that("setmargin uses defaults", {
  widget <- myIO::setmargin(myIO::myIO())
  expect_equal(widget$x$options$margin$top, 20)
  expect_equal(widget$x$options$margin$bottom, 40)
  expect_equal(widget$x$options$margin$left, 50)
  expect_equal(widget$x$options$margin$right, 50)
})

test_that("setAxisLimits sets x limits", {
  widget <- myIO::setAxisLimits(myIO::myIO(), xlim = list(min = 0, max = 10))
  expect_equal(widget$x$options$xlim$min, 0)
  expect_equal(widget$x$options$xlim$max, 10)
})

test_that("setAxisLimits sets y limits", {
  widget <- myIO::setAxisLimits(myIO::myIO(), ylim = list(min = -5, max = 100))
  expect_equal(widget$x$options$ylim$min, -5)
  expect_equal(widget$x$options$ylim$max, 100)
})

test_that("setTransitionSpeed sets speed", {
  widget <- myIO::setTransitionSpeed(myIO::myIO(), speed = 1500)
  expect_equal(widget$x$options$transition$speed, 1500)
})

test_that("setTransitionSpeed zero suppresses transitions", {
  widget <- myIO::setTransitionSpeed(myIO::myIO(), speed = 0)
  expect_equal(widget$x$options$transition$speed, 0)
})

test_that("setColorScheme sets colors and activates scheme", {
  widget <- myIO::setColorScheme(myIO::myIO(),
    colorShceme = list("red", "blue")
  )
  expect_equal(widget$x$options$colorScheme[[1]], list("red", "blue"))
  expect_equal(widget$x$options$colorScheme[[3]][1], "on")
})

test_that("setColorScheme sets categories", {
  widget <- myIO::setColorScheme(myIO::myIO(),
    colorShceme = list("red", "blue"),
    setCategories = c("A", "B")
  )
  expect_equal(widget$x$options$colorScheme[[2]], c("A", "B"))
})

test_that("setToolTipOptions sets suppressY", {
  widget <- myIO::setToolTipOptions(myIO::myIO(), suppressY = TRUE)
  expect_true(widget$x$options$toolTipOptions$suppressY)
})

test_that("setToggle sets toggle options", {
  widget <- myIO::setToggle(myIO::myIO(), newY = "Percent", newScaleY = ".0%")
  expect_equal(widget$x$options$toggleY[[1]], "Percent")
  expect_equal(widget$x$options$toggleY[[2]], ".0%")
})

test_that("setReferenceLines sets reference values", {
  widget <- myIO::setReferenceLines(myIO::myIO(), xRef = 5, yRef = 10)
  expect_equal(widget$x$options$referenceLine$x, 5)
  expect_equal(widget$x$options$referenceLine$y, 10)
})

test_that("setReferenceLines defaults to zero", {
  widget <- myIO::setReferenceLines(myIO::myIO())
  expect_equal(widget$x$options$referenceLine$x, 0)
  expect_equal(widget$x$options$referenceLine$y, 0)
})

test_that("all option functions return htmlwidget", {
  w <- myIO::myIO()
  expect_s3_class(myIO::setAxisFormat(w), "htmlwidget")
  expect_s3_class(myIO::dragPoints(w), "htmlwidget")
  expect_s3_class(myIO::flipAxis(w), "htmlwidget")
  expect_s3_class(myIO::defineCategoricalAxis(w), "htmlwidget")
  expect_s3_class(myIO::suppressAxis(w), "htmlwidget")
  expect_s3_class(myIO::suppressLegend(w), "htmlwidget")
  expect_s3_class(myIO::setmargin(w), "htmlwidget")
  expect_s3_class(myIO::setAxisLimits(w), "htmlwidget")
  expect_s3_class(myIO::setTransitionSpeed(w, speed = 500), "htmlwidget")
  expect_s3_class(myIO::setColorScheme(w, colorShceme = list("red")), "htmlwidget")
  expect_s3_class(myIO::setToolTipOptions(w), "htmlwidget")
  expect_s3_class(myIO::setToggle(w, newY = "x"), "htmlwidget")
  expect_s3_class(myIO::setReferenceLines(w), "htmlwidget")
})

test_that("options chain together via pipe", {
  widget <- myIO::myIO() |>
    myIO::setAxisFormat(xAxis = ".0f") |>
    myIO::flipAxis() |>
    myIO::setmargin(top = 100) |>
    myIO::suppressLegend()

  expect_equal(widget$x$options$xAxisFormat, ".0f")
  expect_true(widget$x$options$flipAxis)
  expect_equal(widget$x$options$margin$top, 100)
  expect_true(widget$x$options$suppressLegend)
})
