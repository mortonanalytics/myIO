#!/usr/bin/env Rscript
# Builds data/mydar_iphone_walk.rda from one processed myDAR walk folder
# (walk.copc.laz, terrain.tif, walk.gpkg, trajectory.csv).
#
# The shipped dataset is Ryan's outdoor iPhone walk of 2026-11-15, recorded
# with the myDAR app and reprocessed on a Mac with the myDAR CLI at autodar
# commit a1388d8 (branch build/v1) from the phone's own capture files:
#   mydar process walk.mcap --derived walk.derived.mcap -o <dir>
# (the walk has no walk.pins.mcap; no --geoid was passed, which does not
# matter here because heights are made local below).
#
# The shipped dataset holds no absolute location:
#   - every table is moved to walk-local coordinates by subtraction only
#     (read_mydar_walk(local = TRUE)): x and y become meters from the walk's
#     south-west corner and z becomes height above the lowest DEM cell; no
#     rotation or scaling, so shapes are unchanged. The subtracted origin is
#     not kept (origin = NA).
#   - the project CRS is dropped (walk$crs and the accuracy table's crs column).
#   - feature layers are dropped (their attributes can hold recognized text).
#   - only tables are kept; no raw COPC, GeoTIFF or GeoPackage is shipped, so
#     no georeference, CRS WKT, accuracy VLR, photo position or absolute GPS
#     fix position from the source files is included.
# sigma_m, classes, source, the accuracy figures, GPS residuals and the
# trajectory (already meters east/north/up of the walk's first GPS fix) are
# as measured.
#
# Needs rlas, terra and sf. Run from the package root:
#   Rscript data-raw/mydar_iphone_walk.R <walk-folder>

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1L) stop("usage: Rscript data-raw/mydar_iphone_walk.R <walk-folder>")

devtools::load_all(".", quiet = TRUE)

walk <- read_mydar_walk(args[[1]], max_points = 6000, local = TRUE)
walk$origin <- c(x = NA_real_, y = NA_real_, z = NA_real_)
walk$crs <- NA_character_
walk$accuracy$crs <- NULL
walk$features <- list()
# Number the kept points 1..n instead of by row in the source file.
walk$points$point_id <- seq_len(nrow(walk$points))

mydar_iphone_walk <- walk
save(mydar_iphone_walk, file = "data/mydar_iphone_walk.rda", compress = "xz")
print(mydar_iphone_walk)
