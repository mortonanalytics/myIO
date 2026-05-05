test_that("setBigData builds point mark spec and query template", {
  df <- data.frame(wt = 1:3, mpg = c(20, 21, 22))
  w <- myIO::myIO(df) |>
    myIO::addIoLayer(
      type = "point",
      label = "pts",
      mapping = list(x_var = "wt", y_var = "mpg", color = "gear")
    ) |>
    myIO:::setBigData("https://example.com/data.parquet", schema = c("wt", "mpg", "gear"))

  expect_equal(w$x$coordinator$mark_spec$kind, "scatter")
  expect_equal(w$x$coordinator$mark_spec$channels$x, "wt")
  expect_equal(w$x$coordinator$mark_spec$channels$y, "mpg")
  expect_equal(w$x$coordinator$mark_spec$channels$color, "gear")
  expect_match(w$x$coordinator$query_template, "SELECT")
  expect_match(w$x$coordinator$query_template, '"wt" AS x', fixed = TRUE)
  expect_match(w$x$coordinator$query_template, '"mpg" AS y', fixed = TRUE)
  expect_match(w$x$coordinator$query_template, '"gear" AS color', fixed = TRUE)
  expect_match(w$x$coordinator$query_template, "{{where}}", fixed = TRUE)
  expect_match(w$x$coordinator$query_template, "{{limit}}", fixed = TRUE)
})

test_that("setBigData builds line query template", {
  df <- data.frame(t = 1:3, value = c(4, 5, 6))
  w <- myIO::myIO(df) |>
    myIO::addIoLayer(
      type = "line",
      label = "series",
      mapping = list(x_var = "t", y_var = "value")
    ) |>
    myIO:::setBigData("https://example.com/data.parquet", schema = c("t", "value"))

  expect_equal(w$x$coordinator$mark_spec$kind, "line")
  expect_equal(w$x$coordinator$mark_spec$decimation, "lttb")
  expect_match(w$x$coordinator$query_template, '"t" AS x', fixed = TRUE)
  expect_match(w$x$coordinator$query_template, '"value" AS y', fixed = TRUE)
})

test_that("setBigData builds area query template with baseline", {
  df <- data.frame(t = 1:3, lo = c(1, 2, 3), hi = c(4, 5, 6))
  w <- myIO::myIO(df) |>
    myIO::addIoLayer(
      type = "area",
      label = "band",
      mapping = list(x_var = "t", low_y = "lo", high_y = "hi")
    ) |>
    myIO:::setBigData("https://example.com/data.parquet", schema = c("t", "lo", "hi"))

  expect_equal(w$x$coordinator$mark_spec$kind, "area")
  expect_equal(w$x$coordinator$mark_spec$channels$baseline, "lo")
  expect_match(w$x$coordinator$query_template, '"hi" AS y', fixed = TRUE)
  expect_match(w$x$coordinator$query_template, '"lo" AS baseline', fixed = TRUE)
})

test_that("setBigData rejects faceted and multi-eligible WebGL charts", {
  df <- data.frame(x = 1:3, y = c(4, 5, 6), z = c(7, 8, 9), f = c("a", "a", "b"))
  faceted <- myIO::myIO(df) |>
    myIO::addIoLayer(type = "point", label = "pts", mapping = list(x_var = "x", y_var = "y")) |>
    myIO::setFacet("f")
  expect_error(
    myIO:::setBigData(faceted, "https://example.com/data.parquet", schema = c("x", "y", "z")),
    "faceted"
  )

  multi <- myIO::myIO(df) |>
    myIO::addIoLayer(type = "point", label = "pts", mapping = list(x_var = "x", y_var = "y")) |>
    myIO::addIoLayer(type = "line", label = "line", mapping = list(x_var = "x", y_var = "z"))
  expect_error(
    myIO:::setBigData(multi, "https://example.com/data.parquet", schema = c("x", "y", "z")),
    "Multi-layer"
  )
})

test_that("setBigData leaves query template empty for non-eligible charts", {
  df <- data.frame(x = c("a", "b"), y = c(1, 2))
  w <- myIO::myIO(df) |>
    myIO::addIoLayer(type = "bar", label = "bars", mapping = list(x_var = "x", y_var = "y")) |>
    myIO:::setBigData("https://example.com/data.parquet", schema = c("x", "y"))

  expect_null(w$x$coordinator$mark_spec)
  expect_equal(w$x$coordinator$query_template, "")
})
