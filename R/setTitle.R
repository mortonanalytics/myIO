#' Set Chart Title
#'
#' Sets the title rendered inside the myIO widget SVG.
#'
#' @param myIO A myIO widget object.
#' @param title Character title or NULL to remove the title.
#'
#' @return A modified \code{myIO} htmlwidget object.
#'
#' @examples
#' myIO() |>
#'   setTitle("Miles per gallon") |>
#'   addIoLayer("point", label = "cars",
#'              data = mtcars,
#'              mapping = list(x_var = "wt", y_var = "mpg"))
#'
#' @export
setTitle <- function(myIO, title = NULL) {
  assert_myIO(myIO)
  if (!is.null(title) && (!is.character(title) || length(title) != 1L || is.na(title))) {
    stop("setTitle(): `title` must be NULL or a single character string.", call. = FALSE)
  }
  myIO$x$config$title <- title
  myIO
}
