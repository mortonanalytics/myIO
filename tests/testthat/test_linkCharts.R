test_that("linkCharts sets matching config on both widgets", {
  w1 <- myIO() |>
    addIoLayer(type = "point", label = "scatter",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  w2 <- myIO() |>
    addIoLayer(type = "bar", label = "bars",
      data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg"))
  linked <- linkCharts(w1, w2, on = "cyl")
  expect_length(linked, 2)
  expect_true(linked[[1]]$x$config$interactions$linked$enabled)
  expect_true(linked[[2]]$x$config$interactions$linked$enabled)
  expect_equal(linked[[1]]$x$config$interactions$linked$mode, "both")
  expect_equal(linked[[2]]$x$config$interactions$linked$mode, "both")
})

test_that("linkCharts writes a mode that linked.js actually binds", {
  linked <- linkCharts(myIO(), myIO(), on = "cyl")
  mode <- linked[[1]]$x$config$interactions$linked$mode
  expect_equal(mode, "both")
  # linked.js gates its handlers on exactly this vocabulary; keep the two R
  # entry points (linkCharts + setLinked) writing the same tokens.
  expect_true(mode %in% c("source", "target", "both"))
  expect_equal(linked[[2]]$x$config$interactions$linked$mode, "both")
})

test_that("linkCharts still adds no crosstalk dependency", {
  # The crosstalk-free path is the documented differentiator vs setLinked();
  # if this ever starts failing, the docs on R/linkCharts.R:5 must change too.
  linked <- linkCharts(myIO(), myIO(), on = "cyl")
  deps <- linked[[1]]$dependencies
  has_crosstalk <- any(vapply(deps, function(d) identical(d$name, "crosstalk"), logical(1)))
  expect_false(has_crosstalk)
})

test_that("group ID is consistent across linked widgets", {
  w1 <- myIO() |>
    addIoLayer(type = "point", label = "a",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  w2 <- myIO() |>
    addIoLayer(type = "point", label = "b",
      data = mtcars, mapping = list(x_var = "hp", y_var = "mpg"))
  linked <- linkCharts(w1, w2, on = "cyl")
  expect_equal(
    linked[[1]]$x$config$interactions$linked$group,
    linked[[2]]$x$config$interactions$linked$group
  )
})

test_that("keyColumn matches the on parameter", {
  w1 <- myIO() |>
    addIoLayer(type = "point", label = "a",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  w2 <- myIO() |>
    addIoLayer(type = "point", label = "b",
      data = mtcars, mapping = list(x_var = "hp", y_var = "mpg"))
  linked <- linkCharts(w1, w2, on = "gear")
  expect_equal(linked[[1]]$x$config$interactions$linked$keyColumn, "gear")
  expect_equal(linked[[2]]$x$config$interactions$linked$keyColumn, "gear")
})

test_that("linkCharts errors on non-myIO objects", {
  w1 <- myIO()
  expect_error(linkCharts(w1, list(), on = "cyl"), "Expected a myIO widget")
  expect_error(linkCharts(data.frame(), w1, on = "cyl"), "Expected a myIO widget")
})

test_that("linkCharts uses custom group when provided", {
  w1 <- myIO() |>
    addIoLayer(type = "point", label = "a",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
  w2 <- myIO() |>
    addIoLayer(type = "point", label = "b",
      data = mtcars, mapping = list(x_var = "hp", y_var = "mpg"))
  linked <- linkCharts(w1, w2, on = "cyl", group = "my_custom_group")
  expect_equal(linked[[1]]$x$config$interactions$linked$group, "my_custom_group")
  expect_equal(linked[[2]]$x$config$interactions$linked$group, "my_custom_group")
})

test_that("linkCharts requires at least 2 widgets", {
  w1 <- myIO()
  expect_error(linkCharts(w1, on = "cyl"), "linkCharts\\(\\) requires at least 2 widgets")
})
