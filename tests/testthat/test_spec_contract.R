test_that("serialized config includes canonical spec fields", {
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "line",
      label = "series",
      data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")
    )

  config <- widget$x$config
  layer <- config$layers[[1]]

  expect_equal(config$specVersion, 1L)
  expect_match(layer$id, "^layer_")
  expect_true(all(c("encoding", "sourceKey", "derivedFrom", "order", "visibility", "transform", "transformMeta") %in% names(layer)))
  expect_equal(layer$order, 1L)
})

test_that("source keys are created and preserved in serialized rows", {
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "point",
      label = "series",
      data = mtcars[1:3, ],
      mapping = list(x_var = "wt", y_var = "mpg")
    )

  keys <- vapply(widget$x$config$layers[[1]]$data, function(row) row$`_source_key`, character(1))
  expect_equal(keys, c("row_1", "row_2", "row_3"))
})
