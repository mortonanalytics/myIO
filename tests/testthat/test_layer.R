test_that("addIoLayer creates a single layer", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    label = "test_line",
    color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  expect_length(widget$x$config$layers, 1)
  expect_equal(widget$x$config$layers[[1]]$type, "line")
  expect_equal(widget$x$config$layers[[1]]$label, "test_line")
})

test_that("addIoLayer supports valid types", {
  valid_types <- c("line", "point", "bar", "hexbin", "treemap", "gauge", "donut", "area", "groupedBar", "histogram")
  for (type in valid_types) {
    mapping <- if (type == "treemap") list(level_1 = "vs", level_2 = "cyl") else if (type %in% c("gauge", "histogram")) list(value = "mpg") else list(x_var = "wt", y_var = "mpg")
    widget <- myIO::addIoLayer(myIO::myIO(), type = type, label = paste0("test_", type), color = "blue", data = datasets::mtcars, mapping = mapping)
    expect_length(widget$x$config$layers, 1)
  }
})

test_that("addIoLayer stacks multiple layers", {
  widget <- myIO::myIO()
  widget <- myIO::addIoLayer(widget, type = "line", label = "layer1", color = "red", data = datasets::mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  widget <- myIO::addIoLayer(widget, type = "point", label = "layer2", color = "blue", data = datasets::mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  expect_length(widget$x$config$layers, 2)
})

test_that("dragPoints updates config", {
  widget <- myIO::dragPoints(myIO::myIO())
  expect_true(widget$x$config$interactions$dragPoints)
})

test_that("addIoStatLayer creates lm layer", {
  widget <- myIO::addIoStatLayer(myIO::myIO(), type = "lm", label = "linear_test", color = "red", data = datasets::mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  expect_equal(widget$x$config$layers[[1]]$type, "stat_line")
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

test_that("addIoLayer rejects incompatible layer types", {
  w <- myIO::addIoLayer(myIO::myIO(), type = "donut", label = "d", color = "red", data = data.frame(x = "A", y = 1), mapping = list(x_var = "x", y_var = "y"))
  expect_error(
    myIO::addIoLayer(w, type = "bar", label = "b", color = "blue", data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg")),
    "Cannot mix"
  )
})

test_that("addIoLayer rejects non-numeric y for bar", {
  df <- data.frame(x = c("a", "b"), y = c("foo", "bar"), stringsAsFactors = FALSE)
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "bar", label = "test", color = "red", data = df, mapping = list(x_var = "x", y_var = "y")),
    "must be numeric"
  )
})
