test_that("transform_quantiles computes per-group boxplot summary statistics", {
  df <- data.frame(
    group = c("A", "A", "A", "A", "B", "B", "B", "B"),
    value = c(1, 2, 3, 4, 10, 20, 30, 100),
    `_source_key` = paste0("row_", seq_len(8)),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_quantiles(df, list(x_var = "group", y_var = "value"))

  expect_equal(result$data$group, c("A", "B"))
  expect_equal(result$data$q1, c(1.75, 17.5))
  expect_equal(result$data$median, c(2.5, 25))
  expect_equal(result$data$q3, c(3.25, 47.5))
  expect_equal(result$data$whisker_low, c(1, 10))
  expect_equal(result$data$whisker_high, c(4, 92.5))
  expect_equal(result$meta$name, "quantiles")
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_length(result$meta$sourceKeys, 2)
  expect_equal(result$meta$sourceKeys[[1]], c("row_1", "row_2", "row_3", "row_4"))
  expect_equal(result$meta$sourceKeys[[2]], c("row_5", "row_6", "row_7", "row_8"))
})

test_that("transform_quantiles preserves x_var column name and handles single-row groups", {
  df <- data.frame(
    x = c("A", "B"),
    y = c(5, 9),
    `_source_key` = c("a", "b"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_quantiles(df, list(x_var = "x", y_var = "y"))

  expect_equal(names(result$data), c("x", "q1", "median", "q3", "whisker_low", "whisker_high"))
  expect_equal(result$data$q1, c(5, 9))
  expect_equal(result$data$whisker_low, c(5, 9))
  expect_equal(result$data$whisker_high, c(5, 9))
})
