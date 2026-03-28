# Contract tests for sparkline mode (v1.2)
# These define the target API. They should FAIL until implementation lands.

test_that("myIO() accepts sparkline parameter", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE)
  expect_true(p$x$config$sparkline)
})

test_that("sparkline mode defaults height to 20", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE)
  expect_equal(p$height, 20)
})

test_that("sparkline mode defaults width to 100%", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE)
  expect_equal(p$width, "100%")
})

test_that("sparkline FALSE by default", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)))
  expect_false(isTRUE(p$x$config$sparkline))
})

test_that("sparkline rejects unsupported types", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE)
  expect_error(
    addIoLayer(p, "point", label = "pts",
               mapping = list(x_var = "x", y_var = "y")),
    "parkline"
  )
})

test_that("sparkline accepts line type", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE) |>
    addIoLayer("line", label = "ln",
               mapping = list(x_var = "x", y_var = "y"))
  expect_equal(p$x$config$layers[[1]]$type, "line")
})

test_that("sparkline accepts bar type", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10)), sparkline = TRUE) |>
    addIoLayer("bar", label = "br",
               mapping = list(x_var = "x", y_var = "y"))
  expect_equal(p$x$config$layers[[1]]$type, "bar")
})

test_that("sparkline accepts area type", {
  df <- data.frame(x = 1:10, low = rep(0, 10), high = rnorm(10, 5))
  p <- myIO(df, sparkline = TRUE) |>
    addIoLayer("area", label = "ar",
               mapping = list(x_var = "x", low_y = "low", high_y = "high"))
  expect_equal(p$x$config$layers[[1]]$type, "area")
})

test_that("non-sparkline mode allows all types", {
  p <- myIO(data.frame(x = 1:10, y = rnorm(10))) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "x", y_var = "y"))
  expect_equal(p$x$config$layers[[1]]$type, "point")
})

test_that("existing myIO API unaffected by sparkline addition", {
  # Verify backward compatibility: default args unchanged
  p <- myIO(data = mtcars)
  expect_equal(p$width, "100%")
  expect_equal(p$height, "400px")
  expect_null(p$x$config$sparkline)
})
