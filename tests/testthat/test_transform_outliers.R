test_that("transform_outliers returns rows outside the 1.5*IQR fence", {
  df <- data.frame(
    group = c("A", "A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 100, 10, 11, 12),
    `_source_key` = paste0("row_", seq_len(7)),
    extra = letters[1:7],
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_outliers(df, list(x_var = "group", y_var = "value"))

  expect_equal(nrow(result$data), 1)
  expect_equal(result$data$group, "A")
  expect_equal(result$data$value, 100)
  expect_equal(result$data$extra, "d")
  expect_equal(result$meta$name, "outliers")
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_equal(result$meta$sourceKeys, list("row_4"))
})

test_that("transform_outliers preserves original columns when none are outliers", {
  df <- data.frame(
    x = c("A", "A", "A"),
    y = c(1, 2, 3),
    `_source_key` = c("a", "b", "c"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_outliers(df, list(x_var = "x", y_var = "y"))

  expect_equal(colnames(result$data), colnames(df))
  expect_equal(nrow(result$data), 0)
})
