test_that("mean_ci bounds contain the mean", {
  df <- data.frame(
    group = c("A", "A", "A", "A", "A"),
    value = c(10, 12, 11, 13, 14),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"))
  expect_true(result$data$low_y <= result$data$value)
  expect_true(result$data$high_y >= result$data$value)
})

test_that("level=0.99 is wider than level=0.95", {
  df <- data.frame(
    group = rep("A", 20),
    value = rnorm(20, mean = 10, sd = 2),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  ci_95 <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"),
                                     options = list(level = 0.95))
  ci_99 <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"),
                                     options = list(level = 0.99))
  width_95 <- ci_95$data$high_y - ci_95$data$low_y
  width_99 <- ci_99$data$high_y - ci_99$data$low_y
  expect_true(width_99 > width_95)
})

test_that("n=1 returns NA bounds", {
  df <- data.frame(
    group = "A", value = 42,
    `_source_key` = "row_1",
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$data$value, 42)
  expect_true(is.na(result$data$low_y))
  expect_true(is.na(result$data$high_y))
})

test_that("t-method matches stats::t.test output", {
  set.seed(42)
  values <- rnorm(15, mean = 50, sd = 5)
  df <- data.frame(
    group = rep("A", 15), value = values,
    `_source_key` = paste0("row_", 1:15),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"),
                                     options = list(method = "t", level = 0.95))
  t_result <- t.test(values, conf.level = 0.95)
  expect_equal(result$data$low_y, t_result$conf.int[1], tolerance = 1e-10)
  expect_equal(result$data$high_y, t_result$conf.int[2], tolerance = 1e-10)
})

test_that("includes n and se columns", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B"),
    value = c(1, 2, 3, 10, 20),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"))
  expect_true("n" %in% colnames(result$data))
  expect_true("se" %in% colnames(result$data))
  expect_equal(result$data$n[result$data$group == "A"], 3)
  expect_equal(result$data$n[result$data$group == "B"], 2)
})

test_that("se-method uses normal approximation", {
  set.seed(42)
  values <- rnorm(100, mean = 50, sd = 5)
  df <- data.frame(
    group = rep("A", 100), value = values,
    `_source_key` = paste0("row_", 1:100),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result_t <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"),
                                       options = list(method = "t"))
  result_se <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"),
                                        options = list(method = "se"))
  # With n=100, t and normal should be very close
  expect_equal(result_t$data$low_y, result_se$data$low_y, tolerance = 0.1)
})

test_that("mean_ci returns correct metadata", {
  df <- data.frame(
    group = c("A", "A"), value = c(1, 2),
    `_source_key` = c("row_1", "row_2"),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_mean_ci(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$meta$name, "mean_ci")
  expect_equal(result$meta$derivedFrom, "input_rows")
})
