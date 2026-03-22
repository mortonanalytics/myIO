test_that("transform_ci returns low_y and high_y columns", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"))
  expect_true("low_y" %in% colnames(result$data))
  expect_true("high_y" %in% colnames(result$data))
  expect_equal(nrow(result$data), 100)
})

test_that("CI contains fitted line at every grid point", {
  df <- data.frame(
    x = 1:30, y = 3 * (1:30) + 5 + rnorm(30, sd = 0.5),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  ci_result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"))
  # Fit the same model and predict at grid points
  x_clean <- df$x
  y_clean <- df$y
  model <- lm(y_clean ~ x_clean)
  grid_x <- ci_result$data$x
  fitted_vals <- predict(model, newdata = data.frame(x_clean = grid_x))
  expect_true(all(ci_result$data$low_y <= fitted_vals + 1e-10))
  expect_true(all(ci_result$data$high_y >= fitted_vals - 1e-10))
})

test_that("level=0.99 produces wider band than level=0.95", {
  set.seed(42)
  df <- data.frame(
    x = 1:30, y = (1:30) + rnorm(30, sd = 2),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  ci_95 <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                                options = list(level = 0.95))
  ci_99 <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                                options = list(level = 0.99))
  width_95 <- mean(ci_95$data$high_y - ci_95$data$low_y)
  width_99 <- mean(ci_99$data$high_y - ci_99$data$low_y)
  expect_true(width_99 > width_95)
})

test_that("prediction interval is wider than confidence interval", {
  set.seed(42)
  df <- data.frame(
    x = 1:30, y = (1:30) + rnorm(30, sd = 2),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  ci <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                             options = list(interval = "confidence"))
  pi <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                             options = list(interval = "prediction"))
  ci_width <- mean(ci$data$high_y - ci$data$low_y)
  pi_width <- mean(pi$data$high_y - pi$data$low_y)
  expect_true(pi_width > ci_width)
})

test_that("loess method produces smooth bounds", {
  set.seed(42)
  df <- data.frame(
    x = 1:30, y = sin(1:30) + rnorm(30, sd = 0.2),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                                 options = list(method = "loess"))
  expect_equal(nrow(result$data), 100)
  expect_true(all(result$data$high_y >= result$data$low_y))
})

test_that("transform_ci warns and returns empty with < 3 points", {
  df <- data.frame(
    x = 1:2, y = c(1, 2),
    `_source_key` = c("row_1", "row_2"),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_warning(
    result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y")),
    "at least 3"
  )
  expect_equal(nrow(result$data), 0)
})

test_that("transform_ci respects n_grid option", {
  df <- data.frame(
    x = 1:20, y = 1:20,
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"),
                                 options = list(n_grid = 50))
  expect_equal(nrow(result$data), 50)
})

test_that("transform_ci returns correct metadata", {
  df <- data.frame(
    x = 1:10, y = 1:10,
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_ci(df, list(x_var = "x", y_var = "y"))
  expect_equal(result$meta$name, "ci")
  expect_equal(result$meta$derivedFrom, "input_rows")
})
