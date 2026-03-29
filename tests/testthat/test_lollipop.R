# Contract tests for lollipop chart type (v1.2)

test_that("lollipop layer accepts valid inputs", {
  df <- aggregate(mpg ~ cyl, mtcars, mean)
  p <- myIO(df) |>
    addIoLayer("lollipop", label = "lp",
               data = df,
               mapping = list(x_var = "cyl", y_var = "mpg"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "lollipop")
})

test_that("lollipop rejects missing y_var", {
  expect_error(
    myIO(mtcars) |>
      addIoLayer("lollipop", label = "lp",
                 mapping = list(x_var = "cyl")),
    "y_var"
  )
})

test_that("lollipop supports mean transform", {
  p <- myIO(mtcars) |>
    addIoLayer("lollipop", label = "lp",
               mapping = list(x_var = "cyl", y_var = "mpg"),
               transform = "mean")
  expect_equal(p$x$config$layers[[1]]$transform, "mean")
})

test_that("lollipop is in axes-categorical group", {
  df <- aggregate(mpg ~ cyl, mtcars, mean)
  # Should be compatible with bar (also axes-categorical)
  p <- myIO(df) |>
    addIoLayer("bar", label = "bars",
               mapping = list(x_var = "cyl", y_var = "mpg")) |>
    addIoLayer("lollipop", label = "lp",
               data = df,
               mapping = list(x_var = "cyl", y_var = "mpg"))
  expect_length(p$x$config$layers, 2)
})
