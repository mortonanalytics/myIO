# Tests for myIO constructor and Shiny bindings

test_that("myIO creates an htmlwidget", {
  widget <- myIO::myIO()
  expect_s3_class(widget, "htmlwidget")
})

test_that("myIO sets default dimensions", {
  widget <- myIO::myIO()
  expect_equal(widget$width, "100%")
  expect_equal(widget$height, "400px")
})

test_that("myIO sets custom dimensions", {
  widget <- myIO::myIO(width = "50%", height = "200px")
  expect_equal(widget$width, "50%")
  expect_equal(widget$height, "200px")
})

test_that("myIO sets elementId", {
  widget <- myIO::myIO(elementId = "my-chart")
  expect_equal(widget$elementId, "my-chart")
})

test_that("myIO has default options structure", {
  widget <- myIO::myIO()
  opts <- widget$x$options

  # margins

  expect_equal(opts$margin$top, 30)
  expect_equal(opts$margin$bottom, 60)
  expect_equal(opts$margin$left, 50)
  expect_equal(opts$margin$right, 5)

  # axis limits default to NULL
  expect_null(opts$xlim$min)
  expect_null(opts$xlim$max)
  expect_null(opts$ylim$min)
  expect_null(opts$ylim$max)

  # axis labels default to NULL
  expect_null(opts$xAxisLabel)
  expect_null(opts$yAxisLabel)

  # format defaults
  expect_equal(opts$xAxisFormat, "s")
  expect_equal(opts$yAxisFormat, "s")

  # categorical scale defaults
  expect_false(opts$categoricalScale$xAxis)
  expect_false(opts$categoricalScale$yAxis)

  # legend and axis suppression
  expect_false(opts$suppressLegend)
  expect_false(opts$suppressAxis$xAxis)
  expect_false(opts$suppressAxis$yAxis)

  # transition speed

  expect_equal(opts$transition$speed, 1000)
})

test_that("myIO stores data when provided", {
  widget <- myIO::myIO(data = datasets::mtcars)
  expect_equal(widget$x$data, datasets::mtcars)
})

test_that("myIO data defaults to NULL", {
  widget <- myIO::myIO()
  expect_null(widget$x$data)
})

test_that("myIO has no layers initially", {
  widget <- myIO::myIO()
  expect_null(widget$x$layers)
})

test_that("myIOOutput returns shiny tag", {
  output <- myIO::myIOOutput("test_id")
  expect_s3_class(output, "shiny.tag.list")
})

test_that("renderMyIO returns a shiny render function", {
  render_fn <- myIO::renderMyIO(myIO::myIO())
  expect_true(is.function(render_fn))
})
