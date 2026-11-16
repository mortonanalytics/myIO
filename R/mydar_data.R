#' A real myDAR iPhone walk, in local coordinates
#'
#' Ryan Morton's outdoor walk of 2026-11-15: about 50 seconds and 25 m of track,
#' recorded with the myDAR iPhone app and processed from the phone's capture
#' files with the myDAR CLI at autodar commit \code{a1388d8}. It holds LiDAR
#' points with their classes (vegetation split by height) and per-point sigma,
#' the DEM, the track, 49 GPS fixes with residuals, and the accuracy figures.
#' Camera points beyond LiDAR range are withheld by that processing, so every
#' point is LiDAR. Read with \code{\link{read_mydar_walk}(max_points = 6000)},
#' so it keeps 6,000 of the walk's 887,038 points. Use it to try the
#' \code{mydar_*_view()} functions without the packages the readers need.
#'
#' The walk is shown in local coordinates only, moved there by subtraction (no
#' rotation or scaling): x and y are meters from the walk's south-west corner
#' and z is height above the lowest DEM (ground) cell. The subtracted origin,
#' the project CRS and the feature layers are not included (\code{origin} is
#' \code{NA}, \code{crs} is \code{NA}, \code{features} is empty).
#' \code{sigma_m}, classes, the accuracy figures, GPS residuals and the
#' trajectory (meters east, north and up of the first GPS fix) are as measured.
#'
#' @format A \code{mydar_walk}; see \code{\link{read_mydar_walk}} for its
#'   elements.
#' @source myDAR iPhone walk processed with the myDAR CLI (autodar
#'   \code{a1388d8}). \code{data-raw/mydar_iphone_walk.R} in the myIO
#'   repository builds it from a processed walk folder.
"mydar_iphone_walk"
