test_that("setLinked requires crosstalk", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")) |>
    setLinked(shared)
  expect_true(w$x$config$interactions$linked$enabled)
  expect_equal(w$x$config$interactions$linked$mode, "both")
  expect_false(w$x$config$interactions$linked$filter)
  expect_true(length(w$x$config$interactions$linked$key) > 0)
})

test_that("setLinked filter opt-in", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")) |>
    setLinked(shared, filter = TRUE)
  expect_true(w$x$config$interactions$linked$filter)
})

test_that("setLinked validates mode", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  expect_error(myIO() |> setLinked(shared, mode = "invalid"),
               "'arg' should be one of")
})

test_that("setLinked rejects non-SharedData", {
  skip_if_not_installed("crosstalk")
  expect_error(myIO() |> setLinked(mtcars), "inherits")
})

test_that("setLinked rejects non-myIO input", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  expect_error(setLinked(list(), shared), "Expected a myIO widget")
})

test_that("setLinked source mode", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")) |>
    setLinked(shared, mode = "source")
  expect_equal(w$x$config$interactions$linked$mode, "source")
})
