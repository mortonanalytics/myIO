test_that("transform_loess returns smoothed fitted values", {
  set.seed(42)
  df <- data.frame(
    x = 1:20,
    y = sin(1:20) + rnorm(20, sd = 0.1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y"))
  expect_equal(nrow(result$data), 100)
  expect_true(all(c("x", "y") %in% colnames(result$data)))
  expect_equal(result$meta$name, "loess")
})

test_that("transform_loess respects span option", {
  set.seed(42)
  df <- data.frame(
    x = 1:50, y = sin(1:50) + rnorm(50, sd = 0.3),
    `_source_key` = paste0("row_", 1:50),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  wide <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y"),
                                 options = list(span = 0.9))
  narrow <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y"),
                                   options = list(span = 0.2))
  # Narrower span = more wiggly = higher variance of fitted values
  expect_true(var(narrow$data$y) > var(wide$data$y))
})

test_that("transform_loess warns and returns empty with < 4 points", {
  df <- data.frame(
    x = 1:3, y = c(1, 2, 3),
    `_source_key` = paste0("row_", 1:3),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_warning(
    result <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y")),
    "at least 4"
  )
  expect_equal(nrow(result$data), 0)
})

test_that("transform_loess respects n_grid option", {
  set.seed(42)
  df <- data.frame(
    x = 1:20, y = 1:20 + rnorm(20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y"),
                                   options = list(n_grid = 50))
  expect_equal(nrow(result$data), 50)
})

test_that("transform_loess handles NA values", {
  set.seed(42)
  df <- data.frame(
    x = 1:10, y = c(1:5, NA, 7:10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_loess(df, list(x_var = "x", y_var = "y"))
  expect_equal(nrow(result$data), 100)
  expect_true(all(!is.na(result$data$y)))
})
