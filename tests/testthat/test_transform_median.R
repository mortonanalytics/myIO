test_that("transform_median returns one row per group with median y values", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B"),
    value = c(1, 2, 7, 10, 20),
    `_source_key` = paste0("row_", seq_len(5)),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_median(df, list(x_var = "group", y_var = "value"))

  expect_equal(result$data$group, c("A", "B"))
  expect_equal(result$data$value, c(2, 15))
  expect_equal(result$meta$name, "median")
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_equal(result$meta$sourceKeys[[1]], c("row_1", "row_2", "row_3"))
  expect_equal(result$meta$sourceKeys[[2]], c("row_4", "row_5"))
})

test_that("transform_median preserves mapped column names", {
  df <- data.frame(
    x = c("C", "C", "D"),
    y = c(3, 9, 6),
    `_source_key` = c("a", "b", "c"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_median(df, list(x_var = "x", y_var = "y"))

  expect_equal(names(result$data), c("x", "y"))
  expect_equal(result$data$y, c(6, 6))
})
