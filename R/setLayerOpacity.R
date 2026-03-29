#' Set Layer Opacity
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param label character. The layer label to target.
#' @param opacity numeric. Opacity value between 0 (transparent) and 1 (opaque).
#' @return A modified \code{myIO} htmlwidget object.
#' @examples
#' myIO(iris) |>
#'   addIoLayer("point", label = "pts",
#'              mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
#'   setLayerOpacity("pts", 0.5)
#'
#' @export
setLayerOpacity <- function(myIO, label, opacity) {
  assert_myIO(myIO)
  stopifnot(is.character(label), length(label) == 1)
  stopifnot(is.numeric(opacity), length(opacity) == 1, opacity >= 0, opacity <= 1)

  idx <- which(vapply(myIO$x$config$layers, function(l) l$label, "") == label)
  if (length(idx) == 0) stop("Layer '", label, "' not found", call. = FALSE)

  myIO$x$config$layers[[idx[1]]]$options$opacity <- opacity
  myIO
}
