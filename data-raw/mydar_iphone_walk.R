#!/usr/bin/env Rscript
# Builds data/mydar_iphone_walk.rda from one myDAR walk folder: the files the
# myDAR iPhone app wrote for a walk (walk.copc.laz, terrain.tif, walk.gpkg,
# trajectory.csv), as produced on the phone. Nothing is reprocessed.
#
# The shipped dataset holds no absolute location:
#   - x and y of every table are shifted rigidly to meters from the walk's
#     south-west corner (read_mydar_walk(local = TRUE)); no rotation or scaling,
#     so shapes are unchanged. The shift itself is not kept (origin = NA).
#   - the project CRS is dropped (walk$crs and the accuracy table's crs column).
#   - feature layers are dropped (their attributes can hold recognized text).
#   - only tables are kept; no raw COPC, GeoTIFF or
#     GeoPackage is shipped, so no georeference, CRS WKT, accuracy VLR, photo
#     position or GPS fix position from the source files is included.
# Heights, sigma_m, classes, source, the accuracy figures and the trajectory
# (already meters east/north/up of the walk's first GPS fix) are as measured.
#
# Needs rlas, terra and sf. Run from the package root:
#   Rscript data-raw/mydar_iphone_walk.R <walk-folder>

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1L) stop("usage: Rscript data-raw/mydar_iphone_walk.R <walk-folder>")

devtools::load_all(".", quiet = TRUE)

walk <- read_mydar_walk(args[[1]], max_points = 6000, local = TRUE)
walk$origin <- c(x = NA_real_, y = NA_real_)
walk$crs <- NA_character_
walk$accuracy$crs <- NULL
walk$features <- list()

mydar_iphone_walk <- walk
save(mydar_iphone_walk, file = "data/mydar_iphone_walk.rda", compress = "xz")
print(mydar_iphone_walk)
