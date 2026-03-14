# Tests for myIO constructor and Shiny bindings

test_that("myIO creates an htmlwidget", {
  widget <- myIO::myIO()
  expect_s3_class(widget, "htmlwidget")
})

test_that("myIO sets dimensions and elementId", {
  widget <- myIO::myIO(width = "50%", height = "200px", elementId = "my-chart")
  expect_equal(widget$width, "50%")
  expect_equal(widget$height, "200px")
  expect_equal(widget$elementId, "my-chart")
})

test_that("myIO has default config structure", {
  widget <- myIO::myIO()
  cfg <- widget$x$config
  expect_equal(cfg$specVersion, 1L)
  expect_equal(cfg$layout$margin$top, 30)
  expect_equal(cfg$layout$margin$bottom, 60)
  expect_equal(cfg$layout$margin$left, 50)
  expect_equal(cfg$layout$margin$right, 5)
  expect_null(cfg$scales$xlim$min)
  expect_null(cfg$scales$ylim$max)
  expect_equal(cfg$axes$xAxisFormat, "s")
  expect_equal(cfg$transitions$speed, 1000)
  expect_equal(length(cfg$layers), 0)
  expect_equal(cfg$scales$colorScheme$colors[[1]], "#E69F00")
})

test_that("myIO stores data when provided", {
  widget <- myIO::myIO(data = datasets::mtcars)
  expect_equal(widget$x$data, datasets::mtcars)
})

test_that("shiny bindings are returned", {
  expect_s3_class(myIO::myIOOutput("test_id"), "shiny.tag.list")
  expect_true(is.function(myIO::renderMyIO(myIO::myIO())))
})
