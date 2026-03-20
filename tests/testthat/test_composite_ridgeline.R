test_that("ridgeline expands to one density area per group", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  layers <- w$x$config$layers
  expect_length(layers, 2)
  expect_true(all(vapply(layers, function(layer) layer$type == "area", logical(1))))
  expect_true(all(vapply(layers, function(layer) layer$`_compositeRole` == "density_area", logical(1))))
})

test_that("ridgeline offsets later groups vertically", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  first_layer <- w$x$config$layers[[1]]
  second_layer <- w$x$config$layers[[2]]
  offset_diff <- second_layer$data[[1]]$low_y - first_layer$data[[1]]$low_y

  expect_true(all(abs(offset_diff - offset_diff[[1]]) < 1e-8))
  expect_gt(offset_diff[[1]], 0)
})
