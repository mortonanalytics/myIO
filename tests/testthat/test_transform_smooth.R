test_that("SMA with window=3 averages correctly", {
  df <- data.frame(
    x = 1:5, y = c(1, 2, 3, 4, 5),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                    options = list(method = "sma", window = 3))
  # Middle values should be averaged: (1+2+3)/3=2, (2+3+4)/3=3, (3+4+5)/3=4
  expect_equal(result$data$y, c(2, 3, 4))
  expect_equal(result$data$x, c(2, 3, 4))
})

test_that("EMA with alpha=1 returns raw data", {
  df <- data.frame(
    x = 1:5, y = c(10, 20, 30, 40, 50),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                    options = list(method = "ema", alpha = 1))
  expect_equal(result$data$y, c(10, 20, 30, 40, 50))
})

test_that("EMA with alpha=0 returns constant first value", {
  df <- data.frame(
    x = 1:5, y = c(10, 20, 30, 40, 50),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                    options = list(method = "ema", alpha = 0))
  expect_true(all(result$data$y == 10))
})

test_that("SMA warns and clamps when window > nrow", {
  df <- data.frame(
    x = 1:3, y = c(1, 2, 3),
    `_source_key` = paste0("row_", 1:3),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_warning(
    result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                      options = list(method = "sma", window = 10)),
    "exceeds data length"
  )
  expect_true(nrow(result$data) > 0)
})

test_that("unknown method errors", {
  df <- data.frame(
    x = 1:5, y = 1:5,
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                            options = list(method = "wma")),
    "Unknown smooth method"
  )
})

test_that("data is sorted by x before smoothing", {
  df <- data.frame(
    x = c(3, 1, 2, 5, 4), y = c(30, 10, 20, 50, 40),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                    options = list(method = "sma", window = 3))
  expect_true(all(diff(result$data$x) > 0))
})

test_that("transform_smooth returns correct metadata", {
  df <- data.frame(
    x = 1:10, y = 1:10,
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_smooth(df, list(x_var = "x", y_var = "y"),
                                    options = list(method = "ema"))
  expect_equal(result$meta$name, "smooth")
  expect_equal(result$meta$derivedFrom, "input_rows")
})
