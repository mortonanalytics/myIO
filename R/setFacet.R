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
#'   auto-computes from \code{min_width} and container width.
#' @param min_width Numeric. Minimum panel width in pixels when \code{ncol}
#'   is NULL. Default 200.
#' @param scales Character. Scale sharing mode:
#'   \itemize{
#'     \item \code{"fixed"} -- all panels share x and y scales (default)
#'     \item \code{"free_x"} -- independent x scales per panel
#'     \item \code{"free_y"} -- independent y scales per panel
#'     \item \code{"free"} -- independent x and y scales per panel
#'   }
#' @param label_position Character. Where to show panel labels:
#'   \code{"top"} (default) or \code{"bottom"}.
#' @return Modified myIO widget.
#' @export
#' @examples
#' myIO(iris) |>
#'   addIoLayer("point", label = "pts",
#'              mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
#'   setFacet("Species", ncol = 3)
setFacet <- function(myIO, var, ncol = NULL, min_width = 200,
                     scales = "fixed", label_position = "top") {
  assert_myIO(myIO)
  check_string(var, "var", "setFacet")
  if (!is.null(ncol)) {
    check_number(ncol, "ncol", "setFacet")
    if (ncol < 1) {
      stop("setFacet(): `ncol` must be >= 1, not ", ncol, ".", call. = FALSE)
    }
    ncol <- as.integer(ncol)
  }
  check_number(min_width, "min_width", "setFacet")
  if (min_width <= 0) {
    stop("setFacet(): `min_width` must be > 0, not ", min_width, ".", call. = FALSE)
  }
  check_choice(scales, c("fixed", "free_x", "free_y", "free"), "scales", "setFacet")
  check_choice(label_position, c("top", "bottom"), "label_position", "setFacet")

  myIO$x$config$facet <- list(
    enabled = TRUE,
    var = var,
    ncol = ncol,
    minWidth = min_width,
    scales = scales,
    labelPosition = label_position
  )
  myIO
}
