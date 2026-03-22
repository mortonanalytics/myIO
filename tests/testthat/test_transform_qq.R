test_that("transform_qq returns correct columns in points", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  expect_true("theoretical" %in% colnames(result$points))
  expect_true("sample" %in% colnames(result$points))
  expect_equal(nrow(result$points), nrow(mtcars))
})

test_that("points are sorted by theoretical quantile", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  expect_true(all(diff(result$points$theoretical) >= 0))
})

test_that("sample values are sorted", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  expect_true(all(diff(result$points$sample) >= 0))
})

test_that("reference line has 2 rows", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  expect_equal(nrow(result$line), 2)
  expect_true("theoretical" %in% colnames(result$line))
  expect_true("sample" %in% colnames(result$line))
})

test_that("reference line passes through Q1 and Q3", {
  set.seed(42)
  y <- rnorm(100)
  df <- data.frame(y = y, stringsAsFactors = FALSE)
  result <- myIO:::transform_qq(df, list(y_var = "y"))

  # Line endpoints span the range of theoretical quantiles
  expect_equal(result$line$theoretical[1], min(result$points$theoretical))
  expect_equal(result$line$theoretical[2], max(result$points$theoretical))

  # Check line passes through Q1/Q3
  probs <- c(0.25, 0.75)
  qy <- quantile(sort(y), probs, names = FALSE)
  qx <- quantile(result$points$theoretical, probs, names = FALSE)
  slope <- diff(qy) / diff(qx)
  intercept <- qy[1] - slope * qx[1]
  expect_equal(result$line$sample[1], intercept + slope * result$line$theoretical[1],
               tolerance = 1e-10)
})

test_that("envelope contains reference line", {
  set.seed(42)
  df <- data.frame(y = rnorm(50), stringsAsFactors = FALSE)
  result <- myIO:::transform_qq(df, list(y_var = "y"))

  # Reference line values at envelope theoretical positions
  probs <- c(0.25, 0.75)
  qy <- quantile(sort(df$y), probs, names = FALSE)
  p <- ppoints(50)
  qx <- quantile(qnorm(p), probs, names = FALSE)
  slope <- diff(qy) / diff(qx)
  intercept <- qy[1] - slope * qx[1]
  ref_values <- intercept + slope * result$envelope$theoretical

  expect_true(all(result$envelope$low_y <= ref_values + 1e-10))
  expect_true(all(result$envelope$high_y >= ref_values - 1e-10))
})

test_that("envelope = FALSE returns NULL envelope", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"),
                                 options = list(envelope = FALSE))
  expect_null(result$envelope)
  expect_equal(nrow(result$points), nrow(mtcars))
})

test_that("custom qfunc produces different theoretical quantiles", {
  result_norm <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  result_exp  <- myIO:::transform_qq(mtcars, list(y_var = "mpg"),
                                      options = list(qfunc = qexp))
  # Exponential quantiles are all non-negative
  expect_true(all(result_exp$points$theoretical >= 0))
  # Normal quantiles include negatives
  expect_true(any(result_norm$points$theoretical < 0))
})

test_that("warns and returns empty on < 3 observations", {
  df <- data.frame(y = c(1, 2), stringsAsFactors = FALSE)
  expect_warning(
    result <- myIO:::transform_qq(df, list(y_var = "y")),
    "at least 3"
  )
  expect_equal(nrow(result$points), 0)
  expect_equal(nrow(result$line), 0)
})

test_that("handles NA values in input", {
  df <- data.frame(y = c(1, NA, 3, 4, NA, 6, 7, 8, 9, 10),
                   stringsAsFactors = FALSE)
  result <- myIO:::transform_qq(df, list(y_var = "y"))
  expect_equal(nrow(result$points), 8) # 10 - 2 NAs
})

test_that("metadata has correct name", {
  result <- myIO:::transform_qq(mtcars, list(y_var = "mpg"))
  expect_equal(result$meta$name, "qq")
  expect_equal(result$meta$derivedFrom, "input_rows")
})

test_that("conf_level affects envelope width", {
  set.seed(42)
  df <- data.frame(y = rnorm(50), stringsAsFactors = FALSE)
  r95 <- myIO:::transform_qq(df, list(y_var = "y"), options = list(conf_level = 0.95))
  r99 <- myIO:::transform_qq(df, list(y_var = "y"), options = list(conf_level = 0.99))
  width_95 <- mean(r95$envelope$high_y - r95$envelope$low_y)
  width_99 <- mean(r99$envelope$high_y - r99$envelope$low_y)
  expect_true(width_99 > width_95)
})
