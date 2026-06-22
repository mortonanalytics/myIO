#' Set Faceting (Small Multiples)
#'
#' Splits the chart into a grid of panels, one per unique value of the
#' faceting variable. Each panel shows the same layers filtered to that
#' subset of the data.
#'
#' @param myIO A myIO widget object.
#' @param var Character. Column name to facet by. Must exist in at least
#'   one layer's data.
#' @param ncol Integer or NULL. Number of columns in the grid. If NULL,
#'   auto-computes from \code{minWidth} and container width.
#' @param minWidth Numeric. Minimum panel width in pixels when \code{ncol}
#'   is NULL. Default 200.
#' @param scales Character. Scale sharing mode:
#'   \itemize{
#'     \item \code{"fixed"} -- all panels share x and y scales (default)
#'     \item \code{"free_x"} -- independent x scales per panel
#'     \item \code{"free_y"} -- independent y scales per panel
#'     \item \code{"free"} -- independent x and y scales per panel
#'   }
#' @param labelPosition Character. Where to show panel labels:
#'   \code{"top"} (default) or \code{"bottom"}.
#' @param ... reserved; accepts the deprecated \code{min_width} and
#'   \code{label_position} aliases for \code{minWidth} and \code{labelPosition}.
#' @return Modified myIO widget.
#' @export
#' @examples
#' myIO(iris) |>
#'   addIoLayer("point", label = "pts",
#'              mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
#'   setFacet("Species", ncol = 3)
setFacet <- function(myIO, var, ncol = NULL, minWidth = NULL,
                     scales = "fixed", labelPosition = NULL, ...) {
  assert_myIO(myIO)
  check_string(var, "var", "setFacet")
  dep <- resolve_dot_aliases(
    list(...),
    c(minWidth = "min_width", labelPosition = "label_position"),
    "setFacet"
  )
  if (is.null(minWidth)) minWidth <- dep$minWidth
  if (is.null(minWidth)) minWidth <- 200
  if (is.null(labelPosition)) labelPosition <- dep$labelPosition
  if (is.null(labelPosition)) labelPosition <- "top"
  if (!is.null(ncol)) {
    check_number(ncol, "ncol", "setFacet")
    if (ncol < 1) {
      stop("setFacet(): `ncol` must be >= 1, not ", ncol, ".", call. = FALSE)
    }
    ncol <- as.integer(ncol)
  }
  check_number(minWidth, "minWidth", "setFacet")
  if (minWidth <= 0) {
    stop("setFacet(): `minWidth` must be > 0, not ", minWidth, ".", call. = FALSE)
  }
  check_choice(scales, c("fixed", "free_x", "free_y", "free"), "scales", "setFacet")
  check_choice(labelPosition, c("top", "bottom"), "labelPosition", "setFacet")

  myIO$x$config$facet <- list(
    enabled = TRUE,
    var = var,
    ncol = ncol,
    minWidth = minWidth,
    scales = scales,
    labelPosition = labelPosition
  )
  myIO
}
