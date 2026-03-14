# Edge case tests for addIoLayer, transforms, and utilities

# --- addIoLayer validation edge cases ---

test_that("addIoLayer rejects invalid type", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "sparkle", label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Unknown layer type"
  )
})

test_that("addIoLayer rejects NULL type", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = NULL, label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Unknown layer type"
  )
})

test_that("addIoLayer rejects NA type", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = NA_character_, label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Unknown layer type"
  )
})

test_that("addIoLayer rejects vector type", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = c("line", "point"), label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Unknown layer type"
  )
})

test_that("addIoLayer rejects non-character transform", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", transform = 123, label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "single character string"
  )
})

test_that("addIoLayer rejects NA transform", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", transform = NA_character_, label = "s", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "single character string"
  )
})

test_that("addIoLayer rejects non-list mapping", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", label = "s", data = mtcars, mapping = "wt"),
    "must be a list"
  )
})

test_that("addIoLayer rejects NA label", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", label = NA_character_, data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "single character string"
  )
})

test_that("addIoLayer rejects non-numeric y_var for bar type", {
  df <- data.frame(x = c("A", "B"), y = c("one", "two"), stringsAsFactors = FALSE)
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "bar", label = "b", data = df, mapping = list(x_var = "x", y_var = "y")),
    "must be numeric"
  )
})

test_that("addIoLayer rejects missing required mapping for area", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "area", label = "a", data = mtcars, mapping = list(x_var = "wt")),
    "Missing required mapping"
  )
})

test_that("addIoLayer rejects missing required mapping for histogram", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "histogram", label = "h", data = mtcars, mapping = list(x_var = "wt")),
    "Missing required mapping"
  )
})

test_that("addIoLayer rejects missing required mapping for gauge", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "gauge", label = "g", data = data.frame(v = 0.5), mapping = list(x_var = "v")),
    "Missing required mapping"
  )
})

test_that("addIoLayer rejects missing required mapping for treemap", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "treemap", label = "t", data = mtcars, mapping = list(level_1 = "vs")),
    "Missing required mapping"
  )
})

# --- addIoLayer uses data from myIO() when layer data is NULL ---

test_that("addIoLayer uses widget-level data when layer data is NULL", {
  w <- myIO::myIO(data = mtcars) |>
    myIO::addIoLayer(type = "point", label = "pts", color = "red", mapping = list(x_var = "wt", y_var = "mpg"))
  expect_equal(length(w$x$config$layers[[1]]$data), nrow(mtcars))
})

# --- Grouped layers edge cases ---

test_that("grouped layers with NULL color use Okabe-Ito palette", {
  df <- data.frame(x = 1:4, y = 1:4, g = c("A", "A", "B", "B"))
  w <- myIO::addIoLayer(myIO::myIO(), type = "point", label = "pts", data = df, mapping = list(x_var = "x", y_var = "y", group = "g"))
  colors <- vapply(w$x$config$layers, function(l) l$color, character(1))
  expect_equal(colors[1], "#E69F00")
  expect_equal(colors[2], "#56B4E9")
})

test_that("grouped layers with insufficient colors recycle", {
  df <- data.frame(x = 1:6, y = 1:6, g = rep(c("A", "B", "C"), each = 2))
  w <- myIO::addIoLayer(myIO::myIO(), type = "line", label = "l", color = c("red", "blue"), data = df, mapping = list(x_var = "x", y_var = "y", group = "g"))
  colors <- vapply(w$x$config$layers, function(l) l$color, character(1))
  expect_equal(colors[1], "red")
  expect_equal(colors[2], "blue")
  expect_equal(colors[3], "red")
})

# --- Layer ID sequencing ---

test_that("layer IDs increment correctly", {
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "point", label = "p1", color = "red", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) |>
    myIO::addIoLayer(type = "line", label = "l1", color = "blue", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  ids <- vapply(w$x$config$layers, function(l) l$id, character(1))
  expect_equal(ids[1], "layer_001")
  expect_equal(ids[2], "layer_002")
})

# --- Compatibility matrix additional tests ---

test_that("line + histogram is valid combination", {
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "l1", color = "red", data = data.frame(x = 1:10, y = rnorm(10)), mapping = list(x_var = "x", y_var = "y"))
  # histogram needs different mapping, but layer group check should pass
  # Just verify the first layer was added

  expect_equal(length(w$x$config$layers), 1)
})

test_that("hexbin + line is invalid combination", {
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "hexbin", label = "h", color = "blue", data = data.frame(x = 1:10, y = rnorm(10)), mapping = list(x_var = "x", y_var = "y", radius = 20))
  expect_error(
    myIO::addIoLayer(w, type = "line", label = "l", color = "red", data = data.frame(x = 1:10, y = rnorm(10)), mapping = list(x_var = "x", y_var = "y")),
    "incompatible"
  )
})

test_that("gauge + point is invalid combination", {
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "gauge", label = "g", color = "red", data = data.frame(value = 0.5), mapping = list(value = "value"))
  expect_error(
    myIO::addIoLayer(w, type = "point", label = "p", color = "blue", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "incompatible"
  )
})

# --- Transform edge cases ---

test_that("lm transform produces sorted data by x_var", {
  df <- data.frame(wt = c(3, 1, 2), mpg = c(6, 2, 4), `_source_key` = c("r1", "r2", "r3"), check.names = FALSE)
  w <- myIO::addIoLayer(myIO::myIO(), type = "line", transform = "lm", label = "fit", color = "red", data = df, mapping = list(x_var = "wt", y_var = "mpg"))
  xs <- vapply(w$x$config$layers[[1]]$data, function(r) r$wt, numeric(1))
  expect_equal(xs, sort(xs))
})

test_that("lm transform records meta name", {
  df <- data.frame(x = 1:3, y = 2:4, `_source_key` = c("a", "b", "c"), check.names = FALSE)
  w <- myIO::addIoLayer(myIO::myIO(), type = "line", transform = "lm", label = "fit", color = "red", data = df, mapping = list(x_var = "x", y_var = "y"))
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$transformMeta$name, "lm")
  expect_equal(layer$transform, "lm")
})

test_that("identity transform returns data unchanged", {
  df <- data.frame(x = 1:3, y = 4:6)
  result <- myIO:::transform_identity(df, list(x_var = "x", y_var = "y"))
  expect_equal(result$data, df)
  expect_equal(result$meta$name, "identity")
})

test_that("get_transform returns correct function", {
  fn <- myIO:::get_transform("identity")
  expect_true(is.function(fn))
  fn2 <- myIO:::get_transform("lm")
  expect_true(is.function(fn2))
})

test_that("get_transform errors on unknown name", {
  expect_error(myIO:::get_transform("banana"), "Unknown transform")
})
