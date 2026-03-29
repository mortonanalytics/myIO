# Contract tests for beeswarm chart type (v1.2)

test_that("beeswarm layer accepts valid inputs", {
  p <- myIO(iris) |>
    addIoLayer("beeswarm", label = "bs",
               mapping = list(x_var = "Sepal.Length", y_var = "Species"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "beeswarm")
})

test_that("beeswarm rejects missing x_var", {
  expect_error(
    myIO(iris) |>
      addIoLayer("beeswarm", label = "bs",
                 mapping = list(y_var = "Species")),
    "x_var"
  )
})

test_that("beeswarm supports method option", {
  p <- myIO(iris) |>
    addIoLayer("beeswarm", label = "bs",
               mapping = list(x_var = "Sepal.Length", y_var = "Species"),
               options = list(method = "quasirandom"))
  expect_equal(p$x$config$layers[[1]]$options$method, "quasirandom")
})
