test_that("addIoLayer accepts candlestick mappings", {
  df <- data.frame(
    x = c(1, 2),
    open = c(10, 20),
    high = c(15, 25),
    low = c(8, 18),
    close = c(12, 22),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "candlestick",
    label = "ohlc",
    data = df,
    mapping = list(x_var = "x", open = "open", high = "high", low = "low", close = "close")
  )

  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "candlestick")
  expect_equal(layer$transform, "identity")
  expect_equal(layer$mapping$high, "high")
})

test_that("addIoLayer rejects non-numeric candlestick fields", {
  df <- data.frame(
    x = c(1, 2),
    open = c(10, 20),
    high = c("a", "b"),
    low = c(8, 18),
    close = c(12, 22),
    stringsAsFactors = FALSE
  )

  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "candlestick",
      label = "ohlc",
      data = df,
      mapping = list(x_var = "x", open = "open", high = "high", low = "low", close = "close")
    ),
    "must be numeric"
  )
})
