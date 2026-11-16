skip_without_readers <- function() {
  skip_if_not_installed("rlas")
  skip_if_not_installed("terra")
  skip_if_not_installed("sf")
}

layer_types <- function(w) vapply(w$x$config$layers, `[[`, character(1), "type")
layer_labels <- function(w) vapply(w$x$config$layers, `[[`, character(1), "label")

# Writes the bundled walk's tables back out as a walk folder in the files the
# phone writes (COPC/LAZ cloud with sigma_m and source extra bytes, DEM
# GeoTIFF, GeoPackage, trajectory CSV), so the readers run on real file
# formats without the package shipping raw walk files.
write_walk_dir <- function(walk) {
  dir <- withr::local_tempdir(.local_envir = parent.frame())
  p <- walk$points
  las <- data.frame(X = p$x, Y = p$y, Z = p$z, Classification = as.integer(p$class),
                    sigma_m = p$sigma_m, source = as.integer(p$source == "camera"))
  header <- rlas::header_create(las)
  for (axis in c("X", "Y", "Z")) header[[paste(axis, "scale factor")]] <- 1e-4
  header <- rlas::header_add_extrabytes(header, las$sigma_m, "sigma_m", "1-sigma per axis, meters")
  header <- rlas::header_add_extrabytes(header, las$source, "source", "0 LiDAR, 1 camera")
  rlas::write.las(file.path(dir, "walk.copc.laz"), header, las)

  dem <- terra::rast(walk$terrain[, c("x", "y", "z")], type = "xyz")
  terra::writeRaster(dem, file.path(dir, "terrain.tif"))

  gpkg <- file.path(dir, "walk.gpkg")
  pts <- function(df, cols) sf::st_as_sf(df[, c(cols, "x", "y", "z"), drop = FALSE], coords = c("x", "y", "z"))
  track <- sf::st_sf(length_m = 1, geom = sf::st_sfc(sf::st_linestring(as.matrix(walk$track[, c("x", "y", "z")]))))
  sf::st_write(track, gpkg, "track", quiet = TRUE)
  sf::st_write(pts(walk$track_points, c("t_s", "map_95_m")), gpkg, "track_points", quiet = TRUE)
  gps_cols <- c("t_s", "h_acc_m", "used", "residual_m", "residual_95_m", "map_95_m")
  # sf warns while taking the bounding box of an empty layer.
  suppressWarnings(sf::st_write(pts(walk$gps_fixes, gps_cols), gpkg, "gps_fixes", quiet = TRUE))
  sf::st_write(walk$accuracy, gpkg, "accuracy", quiet = TRUE)

  traj <- walk$trajectory
  utils::write.csv(traj[, setdiff(names(traj), "t_s")], file.path(dir, "trajectory.csv"), row.names = FALSE)
  dir
}

test_that("read_mydar_walk reads the phone's file formats back into the same tables", {
  skip_without_readers()
  skip_if_not_installed("withr")
  src <- mydar_iphone_walk
  walk <- read_mydar_walk(write_walk_dir(src), max_points = Inf, local = FALSE)

  expect_s3_class(walk, "mydar_walk")
  expect_equal(nrow(walk$points), nrow(src$points))
  expect_equal(walk$points$x, src$points$x, tolerance = 1e-3)
  expect_equal(walk$points$z, src$points$z, tolerance = 1e-3)
  expect_equal(walk$points$class_name, src$points$class_name)
  expect_equal(walk$points$source, src$points$source)
  expect_equal(walk$points$sigma_m, src$points$sigma_m, tolerance = 1e-6)
  expect_equal(nrow(walk$terrain), nrow(src$terrain))
  expect_equal(attr(walk$terrain, "cell_size"), attr(src$terrain, "cell_size"), tolerance = 1e-6)
  expect_equal(walk$track[, c("x", "y", "z")], src$track[, c("x", "y", "z")], tolerance = 1e-9)
  expect_equal(walk$track_points$map_95_m, src$track_points$map_95_m)
  expect_equal(walk$gps_fixes$residual_m, src$gps_fixes$residual_m)
  expect_equal(walk$gps_fixes$z, src$gps_fixes$z, tolerance = 1e-9)
  expect_equal(walk$trajectory$t_s, src$trajectory$t_s, tolerance = 1e-9)
  expect_equal(walk$accuracy$shape_95_within_5m_m, src$accuracy$shape_95_within_5m_m)
  expect_equal(unname(walk$origin), c(0, 0, 0))
})

test_that("local = TRUE shifts x, y and z by subtraction and max_points / max_cells thin the walk", {
  skip_without_readers()
  skip_if_not_installed("withr")
  src <- mydar_iphone_walk
  # Lift every height by 500 m so the z shift has something to remove.
  lifted <- src
  for (part in c("points", "terrain", "track", "track_points", "gps_fixes")) {
    lifted[[part]]$z <- lifted[[part]]$z + 500
  }
  dir <- write_walk_dir(lifted)
  shifted <- read_mydar_walk(dir, max_points = 1000, max_cells = 500, local = TRUE)
  expect_equal(nrow(shifted$points), 1000)
  expect_equal(attr(shifted$points, "n_total"), nrow(src$points))
  expect_lte(nrow(shifted$terrain), 500)
  expect_true(all(shifted$points$x >= 0 & shifted$points$y >= 0))
  expect_output(print(shifted), "1,000 of 6,000")

  full <- read_mydar_walk(dir, max_points = Inf, local = TRUE)
  expect_equal(min(full$terrain$z), 0)
  expect_equal(full$origin[["z"]], 500 + min(src$terrain$z), tolerance = 1e-6)
  expect_equal(full$points$x + full$origin[["x"]], src$points$x, tolerance = 1e-3)
  expect_equal(full$points$z, src$points$z, tolerance = 1e-3)
  expect_equal(full$track$z, src$track$z, tolerance = 1e-6)
})

test_that("an empty GeoPackage layer reads as zero rows", {
  skip_without_readers()
  skip_if_not_installed("withr")
  walk <- mydar_iphone_walk
  walk$gps_fixes <- walk$gps_fixes[0, ]
  read <- read_mydar_walk(write_walk_dir(walk), max_points = 100, local = FALSE)
  expect_equal(nrow(read$gps_fixes), 0)
})

test_that("readers fail clearly on missing files and missing packages", {
  expect_error(read_mydar_walk(tempfile()), "directory not found")
  expect_error(read_mydar_trajectory(tempfile()), "file not found")
  skip_if_not_installed("mockery")
  fn <- read_mydar_points
  mockery::stub(fn, "mydar_require", function(pkg, caller) myIO:::mydar_require("not.a.real.pkg", caller))
  expect_error(fn("walk.copc.laz"), "install.packages\\('not.a.real.pkg'\\)")
})

test_that("the bundled walk carries no location: no origin, CRS, project coordinates or absolute heights", {
  walk <- mydar_iphone_walk
  expect_named(walk$origin, c("x", "y", "z"))
  expect_true(all(is.na(walk$origin)))
  expect_true(is.na(walk$crs))
  expect_false("crs" %in% names(walk$accuracy))
  expect_length(walk$features, 0)
  for (part in c("points", "terrain", "track", "track_points", "gps_fixes")) {
    df <- walk[[part]]
    expect_true(all(abs(c(df$x, df$y)) < 1000, na.rm = TRUE), info = part)
    expect_true(all(abs(df$z) < 100, na.rm = TRUE), info = part)
  }
  expect_equal(min(walk$terrain$z), 0)
  expect_output(print(walk), "origin withheld")
})

test_that("mydar_profile keeps points in the corridor, ordered along the line", {
  walk <- mydar_iphone_walk
  ym <- mean(range(walk$track$y))
  prof <- mydar_profile(walk, from = c(0, ym), to = c(22, ym), width = 0.4)
  expect_gt(nrow(prof), 0)
  expect_true(all(abs(prof$offset) <= 0.2))
  expect_true(all(prof$distance >= 0 & prof$distance <= 22))
  expect_false(is.unsorted(prof$distance))
  expect_equal(prof$distance, prof$x, tolerance = 1e-9)
  expect_equal(prof$offset, prof$y - ym, tolerance = 1e-9)
  expect_error(mydar_profile(walk, from = c(1, 1), to = c(1, 1)), "same point")
  expect_error(mydar_profile(walk, width = 0), "positive number")
})

test_that("hillshade is uniform on a plane and darker on a slope facing away from the light", {
  flat <- expand.grid(x = seq(0, 1, 0.1), y = seq(0, 1, 0.1))
  flat$z <- 5
  attr(flat, "cell_size") <- c(0.1, 0.1)
  s <- myIO:::mydar_hillshade(flat, azimuth = 315, altitude = 45)
  expect_equal(s, rep(sin(pi / 4), nrow(flat)), tolerance = 1e-9)

  # Height rising to the east: the slope faces west.
  east_up <- flat
  east_up$z <- east_up$x
  away <- myIO:::mydar_hillshade(east_up, azimuth = 90, altitude = 45)
  toward <- myIO:::mydar_hillshade(east_up, azimuth = 270, altitude = 45)
  expect_true(all(away < sin(pi / 4)))
  expect_true(all(toward > away))
})

# GPS fixes with an ignored fix, which the bundled walk does not have.
with_gps <- function(walk) {
  walk$gps_fixes <- data.frame(t_s = c(1, 2, 3, 4), h_acc_m = c(4, 5, 5, 6), used = c(1, 1, 0, 1),
                               residual_m = c(0.2, 0.1, 0.5, 0.3), residual_95_m = c(9, 9, 10, 11),
                               map_95_m = 17, x = 1:4, y = 1:4, z = 0)
  walk
}

test_that("views build the expected layers from the bundled walk", {
  walk <- mydar_iphone_walk

  plan <- mydar_plan_view(walk, profile = list(from = c(0, 4), to = c(10, 4)))
  expect_true(all(c("Ground", "Building", "Low vegetation", "Track", "Profile line") %in% layer_labels(plan)))
  expect_false("Features" %in% layer_labels(plan))
  track <- plan$x$config$layers[[which(layer_labels(plan) == "Track")]]
  expect_equal(track$options$curveType, "linear")
  expect_equal(plan$x$config$axes$xAxisLabel, "Easting from walk origin (m)")

  terrain <- mydar_terrain_view(walk)
  expect_equal(layer_types(terrain), "raster")
  expect_equal(terrain$x$config$layers[[1]]$mapping$shade, "shade")
  expect_equal(terrain$x$config$layers[[1]]$options$cellWidth, attr(walk$terrain, "cell_size")[1])
  expect_null(mydar_terrain_view(walk, hillshade = FALSE)$x$config$layers[[1]]$mapping$shade)

  profile <- mydar_profile_view(walk)
  expect_true("DEM" %in% layer_labels(profile))
  expect_error(mydar_profile_view(walk, from = c(100, 100), to = c(101, 100)), "no points within")

  no_gps <- walk
  no_gps$gps_fixes <- no_gps$gps_fixes[0, ]
  expect_equal(layer_types(mydar_trajectory_view(walk)), c("line", "point"))
  expect_equal(layer_types(mydar_trajectory_view(no_gps)), "line")
  expect_error(mydar_gps_view(no_gps), "no gps_fixes")
  gps <- mydar_gps_view(walk)
  expect_true(all(c("Used", "Expected 95%") %in% layer_labels(gps)))
  expect_equal(layer_labels(mydar_gps_view(with_gps(walk))), c("Used", "Ignored", "Expected 95%"))
  expect_equal(profile$x$config$axes$yAxisLabel, "Height above lowest ground (m)")
  expect_true(all(layer_types(mydar_sigma_view(walk)) %in% c("area", "point", "rangeBar")))

  acc <- mydar_accuracy_view(walk)$x$config$layers[[1]]
  figures <- vapply(acc$data, `[[`, character(1), "figure")
  expect_equal(figures, c("Shape <5 m", "Map median", "Map max"))
})

test_that("views refuse a walk without the part they plot", {
  walk <- mydar_iphone_walk
  walk$points <- NULL
  expect_error(mydar_plan_view(walk), "this walk has no points")
  expect_error(mydar_plan_view(list()), "must be a mydar_walk")
})

test_that("mydar_dashboard links plan and profile on point_id, and the time charts only with GPS residuals", {
  skip_if_not_installed("htmltools")
  widgets_of <- function(dash) {
    Filter(function(x) inherits(x, "myIO"), unlist(lapply(dash[[2]]$children[[1]], `[[`, "children"), recursive = FALSE))
  }
  key_columns <- function(widgets) {
    vapply(widgets, function(w) {
      l <- w$x$config$interactions$linked
      if (is.null(l)) NA_character_ else l$keyColumn
    }, character(1))
  }

  widgets <- widgets_of(mydar_dashboard(mydar_iphone_walk))
  expect_length(widgets, 7)
  expect_equal(sum(key_columns(widgets) == "point_id", na.rm = TRUE), 2)
  expect_equal(sum(key_columns(widgets) == "t_s", na.rm = TRUE), 2)
  expect_true(isTRUE(widgets[[1]]$x$config$interactions$brush$enabled))

  no_gps <- mydar_iphone_walk
  no_gps$gps_fixes <- no_gps$gps_fixes[0, ]
  widgets <- widgets_of(mydar_dashboard(no_gps))
  expect_length(widgets, 6)
  expect_equal(sum(key_columns(widgets) == "t_s", na.rm = TRUE), 0)
})
