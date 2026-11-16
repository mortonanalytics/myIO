#' A real myDAR iPhone walk, in local coordinates
#'
#' An outdoor walk of about 50 seconds (25 m of track) recorded with the myDAR
#' iPhone app, as the phone processed it: LiDAR and camera
#' points with the phone's classes and per-point sigma, the DEM, the track and
#' the accuracy figures. Read with
#' \code{\link{read_mydar_walk}(max_points = 6000)}, so it keeps 6,000 of the
#' walk's 897,935 points. Use it to try the \code{mydar_*_view()} functions
#' without the packages the readers need.
#'
#' The walk is shown in local coordinates only. x and y are meters from the
#' walk's south-west corner, moved there by a rigid shift (no rotation or
#' scaling), and the shift, the project CRS and the feature layers are not
#' included (\code{origin} is \code{NA}, \code{crs} is \code{NA},
#' \code{features} is empty). Heights, \code{sigma_m}, classes, point source,
#' the accuracy figures and the trajectory (meters east, north and up of the
#' first GPS fix) are as measured. The phone wrote no rows to the walk's
#' \code{gps_fixes} table, so this walk has no GPS residuals.
#'
#' @format A \code{mydar_walk}; see \code{\link{read_mydar_walk}} for its
#'   elements.
#' @source myDAR iPhone app output. \code{data-raw/mydar_iphone_walk.R} in the
#'   myIO repository builds it from a walk folder.
"mydar_iphone_walk"
