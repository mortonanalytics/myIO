test_that("transform_density returns standard area-compatible columns", {
  df <- data.frame(value = c(1, 2, 3, 4), `_source_key` = paste0("row_", 1:4), check.names = FALSE)

  result <- myIO:::transform_density(df, list(y_var = "value"), list())

  expect_equal(names(result$data), c("x_var", "low_y", "high_y"))
  expect_length(result$data$x_var, 128)
  expect_equal(result$data$low_y, rep(0, 128))
  expect_equal(result$meta$name, "density")
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_equal(result$meta$sourceKeys, list(c("row_1", "row_2", "row_3", "row_4")))
})

test_that("transform_density mirrors the density curve when requested", {
  df <- data.frame(value = c(1, 2, 3, 4), `_source_key` = paste0("row_", 1:4), check.names = FALSE)

  result <- myIO:::transform_density(df, list(y_var = "value"), list(mirror = TRUE))

  expect_equal(result$data$low_y, -result$data$high_y)
})

test_that("transform_density handles empty input values", {
  df <- data.frame(value = numeric(0), `_source_key` = character(0), check.names = FALSE)

  result <- myIO:::transform_density(df, list(y_var = "value"), list())

  expect_equal(nrow(result$data), 0)
  expect_equal(names(result$data), c("x_var", "low_y", "high_y"))
})
