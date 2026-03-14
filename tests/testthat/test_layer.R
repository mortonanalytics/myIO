test_that("addIoLayer creates a single identity layer with spec fields", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    label = "test_line",
    color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )

  layer <- widget$x$config$layers[[1]]
  expect_equal(layer$type, "line")
  expect_equal(layer$label, "test_line")
  expect_equal(layer$transform, "identity")
  expect_equal(layer$id, "layer_001")
  expect_equal(layer$sourceKey, "_source_key")
  expect_true(isTRUE(layer$visibility))
})

test_that("addIoLayer supports lm transform through the unified API", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    transform = "lm",
    label = "linear_test",
    color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )

  layer <- widget$x$config$layers[[1]]
  expect_equal(layer$type, "line")
  expect_equal(layer$transform, "lm")
  expect_equal(layer$transformMeta$name, "lm")
  xs <- vapply(layer$data, function(row) row$wt, numeric(1))
  expect_equal(xs, sort(xs))
})

test_that("addIoLayer rejects unknown transform and invalid type/transform pair", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", transform = "unknown", label = "test", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Unknown transform"
  )

  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "point", transform = "lm", label = "test", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "not valid"
  )
})

test_that("addIoLayer rejects missing mapping variable", {
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "line", label = "test", data = mtcars, mapping = list(x_var = "nonexistent", y_var = "mpg")),
    "not found in data"
  )
})

test_that("addIoLayer rejects duplicate label", {
  w <- myIO::addIoLayer(myIO::myIO(), type = "point", label = "pts", color = "red", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  expect_error(
    myIO::addIoLayer(w, type = "line", label = "pts", color = "blue", data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "already exists"
  )
})

test_that("addIoLayer validates compatibility groups", {
  w <- myIO::addIoLayer(myIO::myIO(), type = "donut", label = "d", color = "red", data = data.frame(x = "A", y = 1), mapping = list(x_var = "x", y_var = "y"))
  expect_error(
    myIO::addIoLayer(w, type = "bar", label = "b", color = "blue", data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg")),
    "Compatible layer types here are"
  )
})

test_that("grouped layers use the default Okabe-Ito palette", {
  df <- datasets::airquality
  df$Month <- as.character(df$Month)

  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    label = "temp",
    data = df,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  )

  colors <- vapply(widget$x$config$layers, function(layer) layer$color, character(1))
  expect_equal(colors[[1]], "#E69F00")
  expect_equal(colors[[2]], "#56B4E9")
})

test_that("grouped layers with overlapping group values keep unique labels", {
  df <- datasets::airquality
  df$Month <- as.character(df$Month)

  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "line",
      label = "Temp",
      data = df,
      mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
    ) |>
    myIO::addIoLayer(
      type = "line",
      label = "Wind",
      data = df,
      mapping = list(x_var = "Day", y_var = "Wind", group = "Month")
    )

  labels <- vapply(widget$x$config$layers, function(layer) layer$label, character(1))
  expect_equal(length(labels), length(unique(labels)))
  expect_true(all(grepl("^Temp .+|^Wind .+", labels)))
})

test_that("addIoLayer falls back to widget default data for multiple layers", {
  widget <- myIO::myIO(data = datasets::mtcars) |>
    myIO::addIoLayer(type = "point", label = "points", color = "red", mapping = list(x_var = "wt", y_var = "mpg")) |>
    myIO::addIoLayer(type = "line", label = "trend", color = "blue", mapping = list(x_var = "wt", y_var = "disp"))

  expect_length(widget$x$config$layers[[1]]$data, nrow(datasets::mtcars))
  expect_length(widget$x$config$layers[[2]]$data, nrow(datasets::mtcars))
})
