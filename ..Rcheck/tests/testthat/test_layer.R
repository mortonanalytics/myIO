# Tests for addIoLayer and addIoStatLayer

test_that("addIoLayer creates a single layer", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    label = "test_line",
    color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  expect_s3_class(widget, "htmlwidget")
  expect_length(widget$x$layers, 1)
  expect_equal(widget$x$layers[[1]]$type, "line")
  expect_equal(widget$x$layers[[1]]$color, "red")
  expect_equal(widget$x$layers[[1]]$label, "test_line")
})

test_that("addIoLayer supports all valid layer types", {
  valid_types <- c("line", "point", "bar", "hexbin", "treemap",
                   "gauge", "donut", "area", "groupedBar",
                   "histogram", "density", "ridgeline")

  for (type in valid_types) {
    if (type == "treemap") {
      widget <- myIO::addIoLayer(
        myIO::myIO(),
        type = "treemap",
        label = "tree_test",
        data = datasets::mtcars,
        mapping = list(level_1 = "vs", level_2 = "cyl")
      )
    } else {
      widget <- myIO::addIoLayer(
        myIO::myIO(),
        type = type,
        label = paste0("test_", type),
        color = "blue",
        data = datasets::mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      )
    }
    expect_s3_class(widget, "htmlwidget", info = paste("type:", type))
    expect_length(widget$x$layers, 1, info = paste("type:", type))
  }
})

test_that("addIoLayer rejects invalid type", {
  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "invalid_type",
      label = "test",
      data = datasets::mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")
    )
  )
})

test_that("addIoLayer rejects non-character type", {
  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = 123,
      label = "test",
      data = datasets::mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")
    )
  )
})

test_that("addIoLayer rejects non-list mapping", {
  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "line",
      label = "test",
      data = datasets::mtcars,
      mapping = "not_a_list"
    )
  )
})

test_that("addIoLayer stacks multiple layers", {
  widget <- myIO::myIO()
  widget <- myIO::addIoLayer(widget,
    type = "line", label = "layer1", color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  widget <- myIO::addIoLayer(widget,
    type = "point", label = "layer2", color = "blue",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  expect_length(widget$x$layers, 2)
  expect_equal(widget$x$layers[[1]]$type, "line")
  expect_equal(widget$x$layers[[2]]$type, "point")
})

test_that("addIoLayer handles grouped data", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)

  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    color = c("steelblue", "orange", "green", "red", "purple"),
    label = "Month",
    data = aq,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  )
  expect_length(widget$x$layers, length(unique(aq$Month)))
})

test_that("addIoLayer uses default colors for grouped data when color is NULL", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)

  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "line",
    color = NULL,
    label = "Month",
    data = aq,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  )
  expect_length(widget$x$layers, length(unique(aq$Month)))
  # each layer should have a color assigned
  for (layer in widget$x$layers) {
    expect_true(!is.null(layer$color))
  }
})

test_that("dragPoints adds option to widget", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "point", label = "test", color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  widget <- myIO::dragPoints(widget)
  expect_true(widget$x$options$dragPoints)
})

test_that("addIoStatLayer creates lm layer", {
  widget <- myIO::addIoStatLayer(
    myIO::myIO(),
    type = "lm",
    label = "linear_test",
    color = "red",
    data = datasets::mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
  expect_s3_class(widget, "htmlwidget")
  expect_length(widget$x$layers, 1)
  expect_equal(widget$x$layers[[1]]$type, "stat_line")
  expect_equal(widget$x$layers[[1]]$color, "red")
})

test_that("addIoStatLayer rejects invalid stat type", {
  expect_error(
    myIO::addIoStatLayer(
      myIO::myIO(),
      type = "invalid",
      label = "test",
      color = "red",
      data = datasets::mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")
    )
  )
})

test_that("addIoLayer with toggle creates correct structure", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)
  aq$Percent <- aq$Temp / sum(aq$Temp, na.rm = TRUE)

  widget <- myIO::myIO(elementId = "tester")
  widget <- myIO::addIoLayer(widget,
    type = "line",
    color = c("steelblue", "lightsteelblue", "orange", "green", "purple"),
    label = "Month",
    data = aq,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  )
  widget <- myIO::setAxisLimits(widget, xlim = list(min = "1"))
  widget <- myIO::setToggle(widget, newY = "Percent", newScaleY = ".0%")
  widget <- myIO::setAxisFormat(widget, yAxis = ".0f")

  expect_length(widget$x$layers, 5)
  expect_length(widget$x$options$toggleY, 2)
  expect_equal(widget$x$options$toggleY[[1]], "Percent")
})

test_that("addIoLayer with treemap creates nested structure", {
  widget <- myIO::addIoLayer(
    myIO::myIO(),
    type = "treemap",
    label = "cars",
    data = datasets::mtcars,
    mapping = list(level_1 = "vs", level_2 = "cyl")
  )
  expect_length(widget$x$layers, 1)
  tree_data <- widget$x$layers[[1]]$data
  expect_equal(tree_data$name, "cars")
  expect_true(length(tree_data$children) > 0)
})
