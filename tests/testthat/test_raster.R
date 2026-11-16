grid_df <- function() {
  g <- expand.grid(x = seq(0, 0.4, by = 0.1), y = seq(0, 0.2, by = 0.1))
  g$z <- g$x + g$y
  g$shade <- 0.5
  g
}

test_that("addIoLayer accepts raster mappings, with and without shade", {
  w <- myIO::addIoLayer(myIO::myIO(), type = "raster", label = "dem", data = grid_df(),
                        mapping = list(x_var = "x", y_var = "y", value = "z", shade = "shade"),
                        options = list(cellWidth = 0.1, cellHeight = 0.1))
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "raster")
  expect_equal(layer$mapping$shade, "shade")
  expect_length(layer$data, 15)

  w2 <- myIO::addIoLayer(myIO::myIO(), type = "raster", label = "dem", data = grid_df(),
                         mapping = list(x_var = "x", y_var = "y", value = "z"))
  expect_null(w2$x$config$layers[[1]]$mapping$shade)
})

test_that("addIoLayer rejects missing or non-numeric raster fields", {
  df <- grid_df()
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "raster", label = "dem", data = df,
                     mapping = list(x_var = "x", y_var = "y")),
    "Missing required mapping"
  )
  df$label <- "a"
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "raster", label = "dem", data = df,
                     mapping = list(x_var = "x", y_var = "y", value = "label")),
    "must be numeric for type 'raster'"
  )
  expect_error(
    myIO::addIoLayer(myIO::myIO(), type = "raster", label = "dem", data = df,
                     mapping = list(x_var = "x", y_var = "y", value = "z", shade = "nope")),
    "Column 'nope' not found"
  )
})

test_that("raster composes with point and line layers on continuous axes", {
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "raster", label = "dem", data = grid_df(),
                     mapping = list(x_var = "x", y_var = "y", value = "z")) |>
    myIO::addIoLayer(type = "line", label = "track", data = data.frame(x = c(0, 0.4), y = c(0, 0.2)),
                     mapping = list(x_var = "x", y_var = "y"))
  expect_equal(vapply(w$x$config$layers, `[[`, character(1), "type"), c("raster", "line"))
  expect_error(
    myIO::addIoLayer(w, type = "heatmap", label = "h", data = data.frame(a = "A", b = "B", v = 1),
                     mapping = list(x_var = "a", y_var = "b", value = "v")),
    "incompatible"
  )
})
