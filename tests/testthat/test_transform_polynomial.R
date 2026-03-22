test_that("transform_polynomial fits quadratic data", {
  df <- data.frame(
    x = 1:20,
    y = (1:20)^2 + rnorm(20, sd = 1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_polynomial(df, list(x_var = "x", y_var = "y"),
                                        options = list(degree = 2))
  expect_equal(nrow(result$data), 100)
  # Quadratic fit should closely match x^2 at endpoints
  expect_true(abs(result$data$y[100] - 400) < 50)
  expect_equal(result$meta$name, "polynomial")
})

test_that("transform_polynomial warns and returns empty when degree >= n", {
  df <- data.frame(
    x = 1:3, y = c(1, 4, 9),
    `_source_key` = paste0("row_", 1:3),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_warning(
    result <- myIO:::transform_polynomial(df, list(x_var = "x", y_var = "y"),
                                          options = list(degree = 3)),
    "more data points"
  )
  expect_equal(nrow(result$data), 0)
})

test_that("transform_polynomial respects n_grid option", {
  df <- data.frame(
    x = 1:10, y = (1:10)^2,
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_polynomial(df, list(x_var = "x", y_var = "y"),
                                        options = list(n_grid = 25))
  expect_equal(nrow(result$data), 25)
})

test_that("transform_polynomial returns _source_key in metadata", {
  df <- data.frame(
    x = 1:10, y = 1:10,
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_polynomial(df, list(x_var = "x", y_var = "y"))
  expect_equal(result$meta$derivedFrom, "input_rows")
  expect_length(result$meta$sourceKeys, 10)
})
