test_that("setAxisFormat sets axis formats", {
  widget <- myIO::setAxisFormat(myIO::myIO(), xAxis = ".0f", yAxis = ".1f")
  expect_equal(widget$x$config$axes$xAxisFormat, ".0f")
  expect_equal(widget$x$config$axes$yAxisFormat, ".1f")
})

test_that("layout and scale helpers update config", {
  widget <- myIO::myIO() |>
    myIO::defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE) |>
    myIO::flipAxis() |>
    myIO::setMargin(top = 100) |>
    myIO::suppressLegend()
  expect_true(widget$x$config$scales$categoricalScale$xAxis)
  expect_true(widget$x$config$scales$flipAxis)
  expect_equal(widget$x$config$layout$margin$top, 100)
  expect_true(widget$x$config$layout$suppressLegend)
})

test_that("setAxisLimits and transitions update config", {
  widget <- myIO::myIO() |>
    myIO::setAxisLimits(xlim = list(min = 0, max = 10), ylim = list(min = -5, max = 100)) |>
    myIO::setTransitionSpeed(speed = 1500)
  expect_equal(widget$x$config$scales$xlim$max, 10)
  expect_equal(widget$x$config$scales$ylim$min, -5)
  expect_equal(widget$x$config$transitions$speed, 1500)
})

test_that("setColorScheme uses named structure", {
  widget <- myIO::setColorScheme(myIO::myIO(), colorScheme = list("red", "blue"), setCategories = c("A", "B"))
  expect_equal(widget$x$config$scales$colorScheme$colors, c("red", "blue"))
  expect_equal(widget$x$config$scales$colorScheme$domain, c("A", "B"))
  expect_true(widget$x$config$scales$colorScheme$enabled)
})

test_that("interaction options update config", {
  widget <- myIO::myIO() |>
    myIO::setToolTipOptions(suppressY = TRUE) |>
    myIO::setToggle(variable = "Percent", format = ".0%")
  expect_true(widget$x$config$interactions$toolTipOptions$suppressY)
  expect_equal(widget$x$config$interactions$toggleY$variable, "Percent")
  expect_equal(widget$x$config$interactions$toggleY$format, ".0%")
})

test_that("reference lines update config", {
  widget <- myIO::setReferenceLines(myIO::myIO(), xRef = 5, yRef = 10)
  expect_equal(widget$x$config$referenceLines$x, 5)
  expect_equal(widget$x$config$referenceLines$y, 10)
})
