test_that("lm residuals sum to approximately zero", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"))
  expect_true(abs(sum(result$data$y)) < 1e-10)
  expect_equal(nrow(result$data), 20)
})

test_that("residuals have same length as complete cases", {
  df <- data.frame(
    x = 1:10, y = c(1:5, NA, 7:10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"))
  expect_equal(nrow(result$data), 9)
})

test_that("x values are fitted values not original x", {
  df <- data.frame(
    x = c(1, 2, 3, 4, 5), y = c(2, 4, 6, 8, 10),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"))
  fitted_vals <- stats::fitted(lm(df$y ~ df$x))
  expect_equal(result$data$x, unname(fitted_vals))
})

test_that("loess method works", {
  set.seed(42)
  df <- data.frame(
    x = 1:20, y = sin(1:20) + rnorm(20, sd = 0.1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"),
                                       options = list(method = "loess"))
  expect_equal(nrow(result$data), 20)
  expect_equal(result$meta$name, "residuals")
})

test_that("polynomial method works", {
  df <- data.frame(
    x = 1:15, y = (1:15)^2 + rnorm(15, sd = 1),
    `_source_key` = paste0("row_", 1:15),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"),
                                       options = list(method = "polynomial", degree = 2))
  expect_equal(nrow(result$data), 15)
})

test_that("unknown method errors", {
  df <- data.frame(
    x = 1:5, y = 1:5,
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_residuals(df, list(x_var = "x", y_var = "y"),
                               options = list(method = "gam")),
    "Unknown residuals method"
  )
})
