test_that("transform_mean computes correct group means", {
  df <- data.frame(
    group = c("A", "A", "B", "B"),
    value = c(10, 20, 30, 40),
    `_source_key` = paste0("row_", 1:4),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_mean(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$data$value[result$data$group == "A"], 15)
  expect_equal(result$data$value[result$data$group == "B"], 35)
})

test_that("transform_mean handles NA values", {
  df <- data.frame(
    group = c("A", "A", "A"),
    value = c(10, NA, 20),
    `_source_key` = paste0("row_", 1:3),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_mean(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$data$value, 15)
})

test_that("transform_mean returns NA for empty group after NA removal", {
  df <- data.frame(
    group = c("A"),
    value = NA_real_,
    `_source_key` = "row_1",
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_mean(df, list(x_var = "group", y_var = "value"))
  expect_true(is.na(result$data$value))
})

test_that("transform_mean returns one row per group", {
  df <- data.frame(
    group = c("A", "A", "B", "B", "C", "C"),
    value = c(1, 2, 3, 4, 5, 6),
    `_source_key` = paste0("row_", 1:6),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_mean(df, list(x_var = "group", y_var = "value"))
  expect_equal(nrow(result$data), 3)
})

test_that("transform_mean returns correct metadata", {
  df <- data.frame(
    group = c("A", "A"),
    value = c(10, 20),
    `_source_key` = c("row_1", "row_2"),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )
  result <- myIO:::transform_mean(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$meta$name, "mean")
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_equal(result$meta$sourceKeys[[1]], c("row_1", "row_2"))
})

test_that("aggregate transforms accept empty inputs and summarize missing groups", {
  mapping <- list(x_var = "x", y_var = "y")
  df <- myIO:::ensure_source_key(data.frame(x = c("a", NA, "a", NA), y = c(1, 2, 3, 4)))
  for (name in c("mean", "summary", "mean_ci")) {
    transform <- get(paste0("transform_", name), asNamespace("myIO"))
    result <- transform(df, mapping)
    expected <- if (name == "summary") c(2, 2) else c(2, 3)
    expect_equal(result$data$y, expected)
    expect_equal(result$meta$sourceKeys, list(c("row_1", "row_3"), c("row_2", "row_4")))
    empty <- transform(df[0, ], mapping)
    expect_equal(nrow(empty$data), 0L)
    expect_true(all(c("x", "y") %in% names(empty$data)))
    expect_length(empty$meta$sourceKeys, 0L)
  }
})
