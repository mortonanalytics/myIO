test_that("qq composite returns 3 sublayers by default", {
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "qq", label = "test",
    data = mtcars,
    mapping = list(y_var = "mpg")
  )
  layers <- w$x$config$layers
  expect_equal(length(layers), 3)
  types <- vapply(layers, function(l) l$type, character(1))
  expect_true("area" %in% types)
  expect_true("line" %in% types)
  expect_true("point" %in% types)
})

test_that("qq composite returns 2 sublayers when envelope = FALSE", {
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "qq", label = "test",
    data = mtcars,
    mapping = list(y_var = "mpg"),
    options = list(envelope = FALSE)
  )
  layers <- w$x$config$layers
  expect_equal(length(layers), 2)
  types <- vapply(layers, function(l) l$type, character(1))
  expect_false("area" %in% types)
})

test_that("sublayer roles are correct", {
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "qq", label = "test",
    data = mtcars,
    mapping = list(y_var = "mpg")
  )
  roles <- vapply(w$x$config$layers, function(l) l$`_compositeRole`, character(1))
  expect_true("envelope" %in% roles)
  expect_true("reference" %in% roles)
  expect_true("scatter" %in% roles)
})

test_that("grouped qq produces N sets of sublayers", {
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "qq", label = "test",
    data = iris,
    mapping = list(y_var = "Sepal.Length", group = "Species")
  )
  layers <- w$x$config$layers
  # 3 groups × 3 sublayers = 9
  expect_equal(length(layers), 9)
})

test_that("all sublayers are marked as qq composite", {
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "qq", label = "test",
    data = mtcars,
    mapping = list(y_var = "mpg")
  )
  composites <- vapply(w$x$config$layers, function(l) l$`_composite`, character(1))
  expect_true(all(composites == "qq"))
})
