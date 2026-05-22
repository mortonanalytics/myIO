fan_draws <- function() {
  data.frame(
    day = rep(1:3, each = 12),
    value = unlist(lapply(1:3, function(day) day * 10 + seq_len(12))),
    stringsAsFactors = FALSE
  )
}

test_that("fan composite expands to area layers with interval metadata", {
  w <- myIO::myIO(fan_draws()) |>
    myIO::addIoLayer(
      type = "fan",
      label = "forecast fan",
      mapping = list(x_var = "day", y_var = "value"),
      options = list(levels = c(50, 80, 95))
    )

  layers <- w$x$config$layers
  expect_length(layers, 3)
  expect_true(all(vapply(layers, function(layer) identical(layer$type, "area"), logical(1))))
  expect_true(all(vapply(layers, function(layer) identical(layer$`_composite`, "fan"), logical(1))))
  expect_equal(vapply(layers, function(layer) layer$options$interval_pct, numeric(1)), c(95, 80, 50))
  expect_true(all(vapply(layers, function(layer) identical(layer$options$intervalType, "prediction"), logical(1))))
  expect_true(all(vapply(layers, function(layer) identical(layer$mapping, list(x_var = "x_var", low_y = "low_y", high_y = "high_y")), logical(1))))
})

test_that("fan composite rejects groups below min_obs", {
  df <- data.frame(day = 1:3, value = c(10, 20, 30))

  expect_error(
    myIO::myIO(df) |>
      myIO::addIoLayer(
        type = "fan",
        label = "fan",
        mapping = list(x_var = "day", y_var = "value")
      ),
    "min_obs"
  )
})

test_that("fan composite accepts precomputed interval columns", {
  df <- data.frame(
    day = 1:2,
    value = c(10, 20),
    low_50 = c(8, 18),
    high_50 = c(12, 22),
    low_95 = c(5, 15),
    high_95 = c(15, 25)
  )

  w <- myIO::myIO(df) |>
    myIO::addIoLayer(
      type = "fan",
      label = "fan",
      mapping = list(x_var = "day", y_var = "value"),
      options = list(levels = c(50, 95), precomputed = TRUE)
    )

  layers <- w$x$config$layers
  expect_equal(vapply(layers, function(layer) layer$options$interval_pct, numeric(1)), c(95, 50))
  expect_equal(layers[[1]]$data[[1]]$low_y, 5)
  expect_equal(layers[[1]]$data[[1]]$high_y, 15)
})
