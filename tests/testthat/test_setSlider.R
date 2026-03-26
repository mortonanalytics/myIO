test_that("setSlider adds slider config", {
  w <- myIO() |> setSlider("ci_level", "Confidence", 0.80, 0.99, 0.95, 0.01)
  sl <- w$x$config$interactions$sliders
  expect_length(sl, 1)
  expect_equal(sl[[1]]$param, "ci_level")
  expect_equal(sl[[1]]$label, "Confidence")
  expect_equal(sl[[1]]$min, 0.80)
  expect_equal(sl[[1]]$max, 0.99)
  expect_equal(sl[[1]]$value, 0.95)
  expect_equal(sl[[1]]$step, 0.01)
  expect_equal(sl[[1]]$debounce, 200)
})

test_that("setSlider is additive", {
  w <- myIO() |>
    setSlider("ci_level", "CI", 0.80, 0.99, 0.95) |>
    setSlider("degree", "Degree", 1, 5, 2, 1)
  expect_length(w$x$config$interactions$sliders, 2)
  expect_equal(w$x$config$interactions$sliders[[1]]$param, "ci_level")
  expect_equal(w$x$config$interactions$sliders[[2]]$param, "degree")
})

test_that("setSlider custom debounce", {
  w <- myIO() |> setSlider("span", "Span", 0.1, 1, 0.5, debounce = 500)
  expect_equal(w$x$config$interactions$sliders[[1]]$debounce, 500)
})

test_that("setSlider rejects non-myIO input", {
  expect_error(setSlider(list(), "p", "l", 0, 1, 0.5),
               "Expected a myIO widget")
})

test_that("setSlider rejects non-numeric values", {
  expect_error(myIO() |> setSlider("p", "l", "a", 1, 0.5))
})

test_that("setSlider rejects non-character param", {
  expect_error(myIO() |> setSlider(123, "l", 0, 1, 0.5))
})

test_that("setSlider null step is allowed", {
  w <- myIO() |> setSlider("p", "label", 0, 1, 0.5)
  expect_null(w$x$config$interactions$sliders[[1]]$step)
})

test_that("setSlider rejects min >= max", {
  expect_error(myIO() |> setSlider("p", "l", 5, 1, 3), "min.*less than.*max")
  expect_error(myIO() |> setSlider("p", "l", 1, 1, 1), "min.*less than.*max")
})

test_that("setSlider rejects value out of range", {
  expect_error(myIO() |> setSlider("p", "l", 0, 1, 2), "value.*between")
  expect_error(myIO() |> setSlider("p", "l", 0, 1, -1), "value.*between")
})
