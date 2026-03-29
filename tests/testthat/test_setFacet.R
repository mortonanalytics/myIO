# Contract tests for setFacet (v1.2 small multiples)

test_that("setFacet stores config correctly", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setFacet("Species")
  expect_true(p$x$config$facet$enabled)
  expect_equal(p$x$config$facet$var, "Species")
  expect_equal(p$x$config$facet$scales, "fixed")
  expect_null(p$x$config$facet$ncol)
  expect_equal(p$x$config$facet$minWidth, 200)
  expect_equal(p$x$config$facet$labelPosition, "top")
})

test_that("setFacet validates inputs", {
  p <- myIO(iris)
  expect_error(setFacet(p, 123))           # not character
  expect_error(setFacet(p, c("a", "b")))   # length > 1
  expect_error(setFacet(p, "x", ncol = -1)) # negative
  expect_error(setFacet(p, "x", scales = "invalid"))
  expect_error(setFacet(p, "x", label_position = "left"))
})

test_that("setFacet with explicit ncol", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setFacet("Species", ncol = 2)
  expect_equal(p$x$config$facet$ncol, 2L)
})

test_that("setFacet free scales", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setFacet("Species", scales = "free")
  expect_equal(p$x$config$facet$scales, "free")
})

test_that("setFacet label_position bottom", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setFacet("Species", label_position = "bottom")
  expect_equal(p$x$config$facet$labelPosition, "bottom")
})

test_that("setFacet custom min_width", {
  p <- myIO(iris) |>
    addIoLayer("point", label = "pts",
               mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
    setFacet("Species", min_width = 300)
  expect_equal(p$x$config$facet$minWidth, 300)
})

test_that("setFacet validates myIO object", {
  expect_error(setFacet("not_widget", "x"))
})

test_that("default config has no facet", {
  p <- myIO(iris)
  expect_null(p$x$config$facet)
})
