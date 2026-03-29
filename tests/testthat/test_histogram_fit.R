test_that("normal fit produces 100-point grid", {
  set.seed(42)
  df <- data.frame(value = rnorm(200, mean = 5, sd = 2))
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  result <- myIO:::transform_fit_distribution(
    df,
    mapping = list(value = "value"),
    options = list(family = "normal")
  )
  expect_equal(nrow(result$data), 100)
  expect_true("x_var" %in% colnames(result$data))
  expect_true("y_var" %in% colnames(result$data))
})

test_that("all density values are positive", {
  set.seed(42)
  df <- data.frame(value = rnorm(200, mean = 10, sd = 3))
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  result <- myIO:::transform_fit_distribution(
    df,
    mapping = list(value = "value"),
    options = list(family = "normal")
  )
  expect_true(all(result$data$y_var > 0))
})

test_that("lognormal rejects non-positive data", {
  df <- data.frame(value = c(-1, 0, 1, 2, 3))
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  expect_error(
    myIO:::transform_fit_distribution(
      df,
      mapping = list(value = "value"),
      options = list(family = "lognormal")
    ),
    "positive"
  )
})

test_that("exponential rate is correct (1/mean)", {
  set.seed(42)
  df <- data.frame(value = rexp(500, rate = 2))
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  result <- myIO:::transform_fit_distribution(
    df,
    mapping = list(value = "value"),
    options = list(family = "exponential")
  )
  expected_rate <- 1 / mean(df$value)
  expect_equal(result$params$rate, expected_rate)
})

test_that("unknown family errors", {
  df <- data.frame(value = 1:10)
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  expect_error(
    myIO:::transform_fit_distribution(
      df,
      mapping = list(value = "value"),
      options = list(family = "weibull")
    ),
    "Unknown family"
  )
})

test_that("composite expands correctly", {
  set.seed(42)
  df <- data.frame(value = rnorm(100))
  df[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(df)))
  layers <- myIO:::composite_histogram_fit(
    df,
    mapping = list(value = "value"),
    label = "test",
    color = NULL,
    options = list()
  )
  expect_equal(length(layers), 2)
  types <- vapply(layers, function(l) l$type, character(1))
  expect_true("bar" %in% types)
  expect_true("line" %in% types)
  roles <- vapply(layers, function(l) l$role, character(1))
  expect_true("histogram" %in% roles)
  expect_true("density_line" %in% roles)
})

test_that("end-to-end widget creation works", {
  set.seed(42)
  df <- data.frame(value = rnorm(100, mean = 5, sd = 2))
  w <- myIO::myIO(data = df) |>
    myIO::addIoLayer(
      type = "histogram_fit",
      label = "fit_test",
      mapping = list(value = "value"),
      options = list(family = "normal")
    )
  expect_s3_class(w, "myIO")
  layers <- w$x$config$layers
  expect_true(length(layers) >= 2)
  types <- vapply(layers, function(l) l$type, character(1))
  expect_true("bar" %in% types)
  expect_true("line" %in% types)
})
