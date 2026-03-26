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
  check_choice(mode, c("click"), "mode", "setAnnotation")
  if (!is.null(labels)) {
    if (!is.character(labels) || length(labels) == 0) {
      stop("setAnnotation(): `labels` must be a non-empty character vector, not ",
           if (length(labels) == 0) "empty vector"
           else paste0(class(labels)[1], " of length ", length(labels)),
           ".", call. = FALSE)
    }
  }
  if (!is.null(colors)) {
    if (!is.character(colors) || is.null(names(colors))) {
      stop("setAnnotation(): `colors` must be a named character vector ",
           "(e.g., c(outlier = \"#E63946\", normal = \"#2A9D8F\")), ",
           if (is.null(names(colors))) "but names are missing."
           else paste0("not ", class(colors)[1], "."),
           call. = FALSE)
    }
  }
  myIO$x$config$interactions$annotation <- list(
    enabled = TRUE,
    presetLabels = labels,
    categoryColors = colors,
    mode = mode
  )
  myIO
}
