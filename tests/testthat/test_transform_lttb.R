# D4: opt-in R-side LTTB downsampling for line/area layers.

test_that("lttb_select keeps at most threshold points, including first and last", {
  x <- as.numeric(1:10000)
  y <- sin(x / 200)
  idx <- lttb_select(x, y, 500L)
  expect_length(idx, 500L)
  expect_identical(idx[1], 1L)
  expect_identical(idx[length(idx)], 10000L)
  expect_false(is.unsorted(idx))
  expect_equal(length(unique(idx)), length(idx))
  expect_true(all(idx >= 1L & idx <= 10000L))
})

test_that("lttb_select is a no-op when n <= threshold or n is tiny", {
  expect_identical(lttb_select(as.numeric(1:100), as.numeric(1:100), 500L), 1:100)
  expect_identical(lttb_select(c(1, 2, 3), c(1, 2, 3), 2L), 1:3)
  expect_identical(lttb_select(numeric(0), numeric(0), 500L), integer(0))
})

test_that("lttb_select produces no duplicate indices on degenerate geometry", {
  # A spike then a collinear tail forces all-zero triangle areas in a bucket,
  # which previously made adjacent buckets select the shared endpoint twice.
  x <- c(1, 2, 3, 4, 5) * 1.0
  y <- c(0, 0, 5, 3.5, 2) * 1.0
  idx <- lttb_select(x, y, 4L)
  expect_length(idx, 4L)
  expect_equal(length(unique(idx)), 4L)
  expect_identical(idx[1L], 1L)
  expect_identical(idx[4L], 5L)
})

test_that("lttb_select keeps uniqueness on a flat (constant-y) series", {
  x <- as.numeric(1:2000)
  y <- rep(7, 2000)
  idx <- lttb_select(x, y, 300L)
  expect_length(idx, 300L)
  expect_equal(length(unique(idx)), 300L)
  expect_false(is.unsorted(idx))
})

test_that("transform_lttb downsamples and preserves columns + extremes", {
  df <- data.frame(x = as.numeric(1:5000), y = sin((1:5000) / 100), g = "a",
                   stringsAsFactors = FALSE)
  res <- transform_lttb(df, list(x_var = "x", y_var = "y"),
                        list(threshold = 1000))
  expect_equal(nrow(res$data), 1000L)
  expect_identical(colnames(res$data), c("x", "y", "g"))
  expect_equal(res$data$x[1], 1)
  expect_equal(res$data$x[nrow(res$data)], 5000)
  expect_identical(res$meta$name, "lttb")
})

test_that("transform_lttb defaults to threshold 2000", {
  df <- data.frame(x = as.numeric(1:5000), y = as.numeric(1:5000))
  res <- transform_lttb(df, list(x_var = "x", y_var = "y"), list())
  expect_equal(nrow(res$data), 2000L)
})

test_that("transform_lttb rejects an invalid threshold (< 3 or non-numeric)", {
  df <- data.frame(x = 1:10, y = 1:10)
  expect_error(transform_lttb(df, list(x_var = "x", y_var = "y"),
                              list(threshold = 2)), "threshold")
  expect_error(transform_lttb(df, list(x_var = "x", y_var = "y"),
                              list(threshold = "lots")), "threshold")
})

test_that("transform_lttb errors informatively on NA values", {
  df <- data.frame(x = as.numeric(1:100),
                   y = c(rep(0, 50), NA, rep(0, 49)))
  expect_error(
    transform_lttb(df, list(x_var = "x", y_var = "y"), list(threshold = 50)),
    "non-NA"
  )
})

test_that("addIoLayer accepts lttb for line, rejects it elsewhere", {
  df <- data.frame(x = as.numeric(1:3000), y = sin((1:3000) / 100))
  w <- addIoLayer(myIO(), type = "line", label = "l", data = df,
                  mapping = list(x_var = "x", y_var = "y"),
                  transform = "lttb", options = list(threshold = 500))
  layer <- w$x$config$layers[[length(w$x$config$layers)]]
  expect_length(layer$data, 500L)

  expect_error(
    addIoLayer(myIO(), type = "point", label = "p", data = df,
               mapping = list(x_var = "x", y_var = "y"), transform = "lttb"),
    "lttb"
  )
})
