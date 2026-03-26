test_that("brush + drag coexist without error", {
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) |>
    dragPoints() |>
    setBrush()
  expect_true(w$x$config$interactions$dragPoints)
  expect_true(w$x$config$interactions$brush$enabled)
})

test_that("brush + annotation coexist without error", {
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) |>
    setBrush() |>
    setAnnotation(labels = c("outlier"))
  expect_true(w$x$config$interactions$brush$enabled)
  expect_true(w$x$config$interactions$annotation$enabled)
})

test_that("all four interactions coexist", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")) |>
    setBrush() |>
    setAnnotation() |>
    setLinked(shared) |>
    setSlider("ci_level", "CI", 0.80, 0.99, 0.95, 0.01)
  expect_true(w$x$config$interactions$brush$enabled)
  expect_true(w$x$config$interactions$annotation$enabled)
  expect_true(w$x$config$interactions$linked$enabled)
  expect_length(w$x$config$interactions$sliders, 1)
})

test_that("brush + annotation + slider without linked", {
  w <- myIO() |>
    addIoLayer(type = "point", label = "pts",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) |>
    setBrush() |>
    setAnnotation() |>
    setSlider("degree", "Degree", 1, 5, 2, 1)
  expect_true(w$x$config$interactions$brush$enabled)
  expect_true(w$x$config$interactions$annotation$enabled)
  expect_length(w$x$config$interactions$sliders, 1)
})
