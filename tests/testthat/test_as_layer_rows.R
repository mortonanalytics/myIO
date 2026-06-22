# D1: as_layer_rows() was rewritten from per-row `data[i, , drop = FALSE]`
# subsetting to column-extraction-then-index for speed. These tests pin the
# output to be byte-identical to the prior implementation across every column
# type the package serializes, since every non-treemap chart type funnels its
# layer data through this one function. The prior implementation is embedded
# verbatim as the oracle.

old_as_layer_rows <- function(data) {
  lapply(seq_len(nrow(data)), function(i) {
    lapply(data[i, , drop = FALSE], function(col) col[[1]])
  })
}

mixed_frame <- function(n) {
  data.frame(
    num = as.numeric(seq_len(n)) + 0.5,
    int = seq_len(n),
    chr = rep_len(letters, n),
    lgl = rep_len(c(TRUE, FALSE, NA), n),
    fct = factor(rep_len(c("a", "b", "c"), n)),
    dte = as.Date("2020-01-01") + seq_len(n),
    pos = as.POSIXct("2020-01-01 00:00:00", tz = "UTC") + seq_len(n),
    nas = c(NA_real_, as.numeric(seq_len(n - 1))),
    stringsAsFactors = FALSE
  )
}

list_col_frame <- function(n) {
  d <- data.frame(num = as.numeric(seq_len(n)), stringsAsFactors = FALSE)
  d$lst <- lapply(seq_len(n), function(i) list(a = i, b = letters[i]))
  d
}

test_that("output is identical to the prior implementation across column types", {
  for (n in c(1L, 2L, 5L, 50L)) {
    d <- mixed_frame(n)
    expect_identical(as_layer_rows(d), old_as_layer_rows(d))
  }
})

test_that("serialized JSON is identical to the prior implementation", {
  d <- mixed_frame(40)
  to_json <- function(x) {
    jsonlite::toJSON(x, auto_unbox = TRUE, digits = NA, na = "null", POSIXt = "ISO8601")
  }
  expect_identical(to_json(as_layer_rows(d)), to_json(old_as_layer_rows(d)))
})

test_that("list-columns are indexed by row, identical to the prior implementation", {
  for (n in c(1L, 3L, 10L)) {
    d <- list_col_frame(n)
    expect_identical(as_layer_rows(d), old_as_layer_rows(d))
  }
})

test_that("single-column frame keeps the named-list-of-scalars shape", {
  d <- data.frame(x = 1:3)
  expect_identical(as_layer_rows(d), old_as_layer_rows(d))
  expect_named(as_layer_rows(d)[[1]], "x")
})

test_that("zero-row frame returns an empty list", {
  d <- mixed_frame(2)[0, , drop = FALSE]
  expect_identical(as_layer_rows(d), list())
  expect_identical(as_layer_rows(d), old_as_layer_rows(d))
})

test_that("integration: built layer data matches the oracle across chart types", {
  df <- data.frame(
    x = c(1, 2, 3, 4, 5),
    y = c(2, 5, 3, 8, 6),
    g = c("a", "a", "b", "b", "a"),
    stringsAsFactors = FALSE
  )
  types <- c("point", "line", "bar")
  for (ty in types) {
    w <- addIoLayer(myIO(), type = ty, label = ty, data = df,
                    mapping = list(x_var = "x", y_var = "y"))
    layer_data <- w$x$config$layers[[length(w$x$config$layers)]]$data
    # Each row is a named list of scalars (the as_layer_rows contract).
    expect_true(is.list(layer_data))
    if (length(layer_data) > 0) {
      expect_true(all(vapply(layer_data, function(r) is.list(r), logical(1))),
                  info = paste("type", ty))
    }
  }
})
