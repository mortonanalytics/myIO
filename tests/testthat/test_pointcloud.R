decode_u <- function(b64, size) {
  readBin(jsonlite::base64_dec(b64), "integer", n = 1e7, size = size, signed = FALSE, endian = "little")
}

test_that("a pointcloud layer packs its points into options instead of rows", {
  df <- data.frame(x = c(0, 10, 5), y = c(0, 20, 10), z = c(0, 2, 1),
                   r = c(255, 0, 0), g = c(0, 255, 0), b = c(0, 0, 255),
                   cls = c(2, 6, 2), s = c(0.001, 10, 0.01))
  w <- addIoLayer(myIO(), type = "pointcloud", label = "cloud", data = df,
                  mapping = list(x_var = "x", y_var = "y", z_var = "z", red = "r", green = "g", blue = "b",
                                 class = "cls", sigma = "s"),
                  options = list(color = "class"))
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "pointcloud")
  expect_length(layer$data, 0)
  o <- layer$options
  expect_equal(o$n, 3)
  expect_equal(o$bbox, c(0, 10, 0, 20, 0, 2))
  expect_equal(decode_u(o$positions, 2), c(0, 0, 0, 65535, 65535, 65535, 32768, 32768, 32768))
  expect_equal(decode_u(o$rgb, 1), c(255, 0, 0, 0, 255, 0, 0, 0, 255))
  expect_equal(decode_u(o$cls, 1), c(2, 6, 2))
  expect_equal(decode_u(o$sigma, 1), c(0, 255, 64))
  expect_equal(o$color, "class")
})

test_that("pointcloud needs x, y, z and stands alone", {
  df <- data.frame(x = 1, y = 2, z = 3)
  expect_error(addIoLayer(myIO(), type = "pointcloud", label = "c", data = df, mapping = list(x_var = "x", y_var = "y")),
               "Missing required mapping")
  w <- addIoLayer(myIO(), type = "pointcloud", label = "c", data = df, mapping = list(x_var = "x", y_var = "y", z_var = "z"))
  expect_null(w$x$config$layers[[1]]$options$rgb)
  expect_error(addIoLayer(w, type = "point", label = "p", data = df, mapping = list(x_var = "x", y_var = "y")),
               "incompatible")
})

test_that("an image layer spans its corner rows and needs numeric corners", {
  corners <- data.frame(x = c(0, 4), y = c(1, 3))
  w <- addIoLayer(myIO(), type = "image", label = "ortho", data = corners,
                  mapping = list(x_var = "x", y_var = "y"), options = list(src = "data:image/png;base64,AAAA"))
  expect_equal(w$x$config$layers[[1]]$type, "image")
  expect_equal(w$x$config$layers[[1]]$options$src, "data:image/png;base64,AAAA")
  expect_error(addIoLayer(myIO(), type = "image", label = "o", data = data.frame(x = c("a", "b"), y = 1:2),
                          mapping = list(x_var = "x", y_var = "y")), "must be numeric for type 'image'")
})

test_that("setEqualAspect sets and clears the scale option", {
  w <- setEqualAspect(myIO())
  expect_true(w$x$config$scales$equalAspect)
  expect_false(setEqualAspect(w, FALSE)$x$config$scales$equalAspect)
  expect_error(setEqualAspect(myIO(), "yes"))
})

test_that("pointcloud packs point source, a DEM grid and a mesh", {
  df <- data.frame(x = c(0, 1), y = c(0, 1), z = c(0, 1), src = c("LiDAR", "camera"))
  w <- addIoLayer(myIO(), type = "pointcloud", label = "c", data = df,
                  mapping = list(x_var = "x", y_var = "y", z_var = "z", source = "src"))
  expect_equal(decode_u(w$x$config$layers[[1]]$options$src, 1), c(0, 1))

  terrain <- data.frame(x = c(0, 0.5, 0, 0.5), y = c(0, 0, 0.5, 0.5), z = c(1, 2, 3, 4))[-4, ]
  attr(terrain, "cell_size") <- c(0.5, 0.5)
  g <- myIO:::pointcloud_terrain(terrain)
  expect_equal(c(g$cols, g$rows, g$x0, g$y0, g$dx), c(2, 2, 0, 0, 0.5))
  z <- readBin(jsonlite::base64_dec(g$z), "double", n = 4, size = 4, endian = "little")
  expect_equal(z[1:3], c(1, 2, 3))
  expect_true(is.nan(z[4]))

  mesh <- list(vertices = data.frame(x = c(0, 1, 0), y = c(0, 0, 1), z = 0, r = 1L, g = 2L, b = 3L),
               faces = matrix(c(0L, 1L, 2L), ncol = 3))
  m <- myIO:::pointcloud_mesh(mesh)
  expect_equal(c(m$nv, m$nf), c(3, 1))
  expect_equal(readBin(jsonlite::base64_dec(m$faces), "integer", n = 3, size = 4, endian = "little"), c(0L, 1L, 2L))
  expect_equal(decode_u(m$colors, 1), rep(1:3, 3))
})
