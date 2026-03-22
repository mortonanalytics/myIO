test_that("summary count returns number of non-NA values per group", {
  df <- data.frame(
    group = c("A", "A", "B", "B", "B"),
    value = c(1, NA, 3, 4, 5),
    `_source_key` = paste0("row_", 1:5),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_summary(df, list(x_var = "group", y_var = "value"),
                                     options = list(stat = "count"))
  expect_equal(result$data$value[result$data$group == "A"], 1)
  expect_equal(result$data$value[result$data$group == "B"], 3)
})

test_that("summary sum returns correct totals", {
  df <- data.frame(
    group = c("A", "A", "B", "B"),
    value = c(10, 20, 30, 40),
    `_source_key` = paste0("row_", 1:4),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_summary(df, list(x_var = "group", y_var = "value"),
                                     options = list(stat = "sum"))
  expect_equal(result$data$value[result$data$group == "A"], 30)
  expect_equal(result$data$value[result$data$group == "B"], 70)
})

test_that("summary sd returns correct standard deviation", {
  df <- data.frame(
    group = c("A", "A", "A", "A"),
    value = c(2, 4, 4, 4),
    `_source_key` = paste0("row_", 1:4),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_summary(df, list(x_var = "group", y_var = "value"),
                                     options = list(stat = "sd"))
  expect_equal(result$data$value, sd(c(2, 4, 4, 4)))
})

test_that("summary defaults to count", {
  df <- data.frame(
    group = c("A", "A"),
    value = c(1, 2),
    `_source_key` = c("row_1", "row_2"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_summary(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$data$value, 2)
})

test_that("summary errors on unknown stat", {
  df <- data.frame(
    group = "A", value = 1, `_source_key` = "row_1",
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_summary(df, list(x_var = "group", y_var = "value"),
                             options = list(stat = "banana")),
    "Unknown stat"
  )
})

test_that("summary returns correct metadata", {
  df <- data.frame(
    group = c("A", "B"),
    value = c(1, 2),
    `_source_key` = c("row_1", "row_2"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_summary(df, list(x_var = "group", y_var = "value"),
                                     options = list(stat = "sum"))
  expect_equal(result$meta$name, "summary")
  expect_equal(result$meta$derivedFrom, "input_rows")
})
