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
  expect_equal(cfg$specVersion, 2L)
  expect_equal(cfg$layout$margin$top, 30)
  expect_equal(cfg$layout$margin$bottom, 60)
  expect_equal(cfg$layout$margin$left, 50)
  expect_equal(cfg$layout$margin$right, 5)
  expect_null(cfg$scales$xlim$min)
  expect_null(cfg$scales$ylim$max)
  expect_equal(cfg$axes$xAxisFormat, "s")
  expect_equal(cfg$transitions$speed, 1000)
  expect_equal(cfg$webgl_threshold, 50000L)
  expect_false(cfg$unify_data_path)
  expect_equal(length(cfg$layers), 0)
  expect_equal(cfg$scales$colorScheme$colors[[1]], "#4269D0")
})

test_that("myIO validates webgl_threshold", {
  expect_equal(myIO::myIO(webgl_threshold = 1000)$x$config$webgl_threshold, 1000L)
  expect_true(is.infinite(myIO::myIO(webgl_threshold = Inf)$x$config$webgl_threshold))
  expect_error(myIO::myIO(webgl_threshold = 0), "webgl_threshold")
  expect_error(myIO::myIO(webgl_threshold = 1.5), "webgl_threshold")
  expect_error(myIO::myIO(webgl_threshold = NA_real_), "webgl_threshold")
})

test_that("myIO validates unify_data_path", {
  expect_true(myIO::myIO(unify_data_path = TRUE)$x$config$unify_data_path)
  expect_error(myIO::myIO(unify_data_path = NA), "unify_data_path")
  expect_error(myIO::myIO(unify_data_path = "yes"), "unify_data_path")
})

test_that("myIO webgl_threshold Inf serializes as disable sentinel", {
  skip_if_not_installed("jsonlite")
  widget <- myIO::myIO(webgl_threshold = Inf)
  json <- jsonlite::toJSON(widget$x$config, auto_unbox = TRUE, null = "null")
  expect_match(as.character(json), '"webgl_threshold":"Inf"', fixed = TRUE)
})

test_that("myIO stores data when provided", {
  widget <- myIO::myIO(data = datasets::mtcars)
  expect_equal(widget$x$data, datasets::mtcars)
})

test_that("shiny bindings are returned", {
  skip_if_not_installed("shiny")
  expect_s3_class(myIO::myIOOutput("test_id"), "shiny.tag.list")
  expect_true(is.function(myIO::renderMyIO(myIO::myIO())))
})
