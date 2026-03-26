#' Enable Click-to-Annotate
#'
#' Enables annotation mode where clicking a data point opens a label
#' input. Annotations are stored as data and can be exported or accessed
#' as a Shiny reactive input.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param labels character vector of preset label options (optional).
#'   If provided, shows a dropdown instead of free-text input.
#' @param colors named character vector of category colors (optional).
#'   Names are category labels, values are CSS colors.
#' @param mode \code{"click"} (default) to annotate individual points.
#'
#' @return A modified \code{myIO} htmlwidget object with annotation enabled.
#' @examples
#' myIO(data = mtcars) |>
#'   addIoLayer(
#'     type = "point", label = "pts",
#'     mapping = list(x_var = "wt", y_var = "mpg")
#'   ) |>
#'   setAnnotation(labels = c("outlier", "normal"))
#'
#' @export
setAnnotation <- function(myIO, labels = NULL, colors = NULL, mode = "click") {
  assert_myIO(myIO)
  mode <- match.arg(mode, c("click"))
  if (!is.null(labels)) {
    stopifnot(is.character(labels), length(labels) > 0)
  }
  if (!is.null(colors)) {
    stopifnot(is.character(colors), !is.null(names(colors)))
  }
  myIO$x$config$interactions$annotation <- list(
    enabled = TRUE,
    presetLabels = labels,
    categoryColors = colors,
    mode = mode
  )
  myIO
}
