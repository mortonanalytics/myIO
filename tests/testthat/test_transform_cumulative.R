test_that("transform_cumulative computes running totals and bases", {
  df <- data.frame(step = c("A", "B", "C"), value = c(10, -3, 5), stringsAsFactors = FALSE)

  result <- myIO:::transform_cumulative(df, list(x_var = "step", y_var = "value"))

  expect_equal(result$data[["_cumulative_y"]], c(10, 7, 12))
  expect_equal(result$data[["_base_y"]], c(0, 10, 7))
  expect_equal(result$data[["_is_total"]], c(FALSE, FALSE, FALSE))
  expect_equal(result$meta$name, "cumulative")
  expect_equal(result$meta$derivedFrom, "input_rows")
})

test_that("transform_cumulative marks total rows and anchors them at zero", {
  df <- data.frame(
    step = c("A", "B", "Total"),
    value = c(10, 2, NA),
    total = c(FALSE, FALSE, TRUE),
    stringsAsFactors = FALSE
  )

  result <- myIO:::transform_cumulative(df, list(x_var = "step", y_var = "value", total = "total"))

  expect_equal(result$data[["_cumulative_y"]], c(10, 12, 12))
  expect_equal(result$data[["_base_y"]], c(0, 10, 0))
  expect_equal(result$data[["_is_total"]], c(FALSE, FALSE, TRUE))
})
