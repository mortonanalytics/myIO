# Contract tests for setLayerOpacity

test_that("setLayerOpacity sets opacity on layer", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setLayerOpacity("pts", 0.3)
  expect_equal(p$x$config$layers[[1]]$options$opacity, 0.3)
})

test_that("default opacity is not set", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  expect_null(p$x$config$layers[[1]]$options$opacity)
})

test_that("setLayerOpacity rejects invalid values", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  expect_error(setLayerOpacity(p, "pts", 1.5))
  expect_error(setLayerOpacity(p, "pts", -0.1))
  expect_error(setLayerOpacity(p, "pts", "half"))
})

test_that("setLayerOpacity emits fn-prefixed range/type messages", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  expect_error(setLayerOpacity(p, "pts", 1.5),
               "setLayerOpacity\\(\\): `opacity` must be between 0 and 1")
  expect_error(setLayerOpacity(p, "pts", "half"),
               "setLayerOpacity\\(\\): `opacity` must be a single number")
})

test_that("setLayerOpacity errors on unknown layer", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  expect_error(setLayerOpacity(p, "nonexistent", 0.5), "nonexistent")
})
