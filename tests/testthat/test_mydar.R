walk_dir <- function() system.file("extdata", "mydar-synthetic", package = "myIO")

skip_without_readers <- function() {
  skip_if_not_installed("rlas")
  skip_if_not_installed("terra")
  skip_if_not_installed("sf")
}

layer_types <- function(w) vapply(w$x$config$layers, `[[`, character(1), "type")
layer_labels <- function(w) vapply(w$x$config$layers, `[[`, character(1), "label")

test_that("read_mydar_walk reads every walk file into local-meter data frames", {
  skip_without_readers()
  walk <- read_mydar_walk(walk_dir(), max_points = 5000)

  expect_s3_class(walk, "mydar_walk")
  expect_equal(walk$crs, "EPSG:32612")
  expect_equal(nrow(walk$points), 5000)
  expect_equal(attr(walk$points, "n_total"), 63370)
  expect_setequal(unique(walk$points$source), c("LiDAR", "camera"))
  expect_true(all(c("Road", "Building") %in% walk$points$class_name))
  expect_true(all(walk$points$sigma_m > 0 & walk$points$sigma_m < 1))
  expect_equal(attr(walk$terrain, "cell_size"), c(0.1, 0.1), tolerance = 1e-3)
  expect_true(all(walk$points$x >= 0 & walk$points$y >= 0))
  expect_equal(unname(walk$origin), c(271838, 5195303))
  expect_equal(nrow(walk$gps_fixes), 6)
  expect_true(is.na(walk$gps_fixes$x[4]))
  expect_named(walk$features, "hydrant")
  expect_equal(nrow(walk$trajectory), 348)
  expect_equal(walk$trajectory$t_s[1], 0)
  expect_equal(walk$accuracy$shape_95_within_5m_m, 0.0678, tolerance = 1e-3)
  expect_output(print(walk), "5,000 of 63,370")
})

test_that("local = FALSE keeps project coordinates and max_cells aggregates the DEM", {
  skip_without_readers()
  walk <- read_mydar_walk(walk_dir(), max_points = 100, max_cells = 2000, local = FALSE)
  expect_equal(unname(walk$origin), c(0, 0))
  expect_gt(min(walk$points$x), 271000)
  expect_lte(nrow(walk$terrain), 2000)
  expect_gt(attr(walk$terrain, "cell_size")[1], 0.1)
})

test_that("readers fail clearly on missing files and missing packages", {
  expect_error(read_mydar_walk(tempfile()), "directory not found")
  expect_error(read_mydar_trajectory(tempfile()), "file not found")
  skip_if_not_installed("mockery")
  fn <- read_mydar_points
  mockery::stub(fn, "mydar_require", function(pkg, caller) myIO:::mydar_require("not.a.real.pkg", caller))
  expect_error(fn("walk.copc.laz"), "install.packages\\('not.a.real.pkg'\\)")
})

test_that("the bundled synthetic walk matches a fresh read of its source files", {
  skip_without_readers()
  fresh <- read_mydar_walk(walk_dir(), max_points = 6000)
  expect_equal(fresh, mydar_synthetic_walk)
})

test_that("mydar_profile keeps points in the corridor, ordered along the line", {
  walk <- mydar_synthetic_walk
  prof <- mydar_profile(walk, from = c(2, 4), to = c(10, 4), width = 0.4)
  expect_gt(nrow(prof), 0)
  expect_true(all(abs(prof$offset) <= 0.2))
  expect_true(all(prof$distance >= 0 & prof$distance <= 8))
  expect_false(is.unsorted(prof$distance))
  expect_equal(prof$distance, prof$x - 2, tolerance = 1e-9)
  expect_equal(prof$offset, prof$y - 4, tolerance = 1e-9)
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

test_that("views build the expected layers from the synthetic walk", {
  walk <- mydar_synthetic_walk

  plan <- mydar_plan_view(walk, profile = list(from = c(0, 4), to = c(10, 4)))
  expect_true(all(c("Road", "Building", "Track", "Features", "Profile line") %in% layer_labels(plan)))
  track <- plan$x$config$layers[[which(layer_labels(plan) == "Track")]]
  expect_equal(track$options$curveType, "linear")

  terrain <- mydar_terrain_view(walk)
  expect_equal(layer_types(terrain), "raster")
  expect_equal(terrain$x$config$layers[[1]]$mapping$shade, "shade")
  expect_equal(terrain$x$config$layers[[1]]$options$cellWidth, 0.1, tolerance = 1e-3)
  expect_null(mydar_terrain_view(walk, hillshade = FALSE)$x$config$layers[[1]]$mapping$shade)

  profile <- mydar_profile_view(walk)
  expect_true("DEM" %in% layer_labels(profile))
  expect_error(mydar_profile_view(walk, from = c(100, 100), to = c(101, 100)), "no points within")

  expect_equal(layer_types(mydar_trajectory_view(walk)), c("line", "point"))
  expect_true("Expected 95%" %in% layer_labels(mydar_gps_view(walk)))
  expect_true(all(layer_types(mydar_sigma_view(walk)) %in% c("area", "point", "rangeBar")))

  acc <- mydar_accuracy_view(walk)$x$config$layers[[1]]
  figures <- vapply(acc$data, `[[`, character(1), "figure")
  expect_true(all(c("Shape <5 m", "Map median") %in% figures))
})

test_that("views refuse a walk without the part they plot", {
  walk <- mydar_synthetic_walk
  walk$points <- NULL
  expect_error(mydar_plan_view(walk), "this walk has no points")
  expect_error(mydar_plan_view(list()), "must be a mydar_walk")
})

test_that("mydar_dashboard links plan and profile on point_id and the time charts on t_s", {
  skip_if_not_installed("htmltools")
  dash <- mydar_dashboard(mydar_synthetic_walk)
  widgets <- Filter(function(x) inherits(x, "myIO"), unlist(lapply(dash[[2]]$children[[1]], `[[`, "children"), recursive = FALSE))
  expect_length(widgets, 7)
  linked <- lapply(widgets, function(w) w$x$config$interactions$linked)
  on <- vapply(linked, function(l) if (is.null(l)) NA_character_ else l$keyColumn, character(1))
  expect_equal(sum(on == "point_id", na.rm = TRUE), 2)
  expect_equal(sum(on == "t_s", na.rm = TRUE), 2)
  expect_true(isTRUE(widgets[[1]]$x$config$interactions$brush$enabled))
})
