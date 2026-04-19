#' Configure Export Options
#'
#' Controls which export buttons appear in the chart toolbar.
#'
#' @param myIO A myIO widget object.
#' @param png Logical. Show PNG download button. Default TRUE.
#' @param svg Logical. Show SVG download button. Default TRUE.
#' @param pdf Logical. Show PDF download button. Default TRUE.
#' @param clipboard Logical. Show clipboard copy button. Default TRUE.
#' @param csv Logical. Show CSV export button. Default TRUE.
#' @param title Character or NULL. Chart title for PDF metadata.
#' @return Modified myIO widget.
#' @examples
#' myIO(iris) |>
#'   addIoLayer("point", label = "pts",
#'              mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
#'   setExportOptions(svg = TRUE, clipboard = TRUE, pdf = FALSE)
#'
#' @export
setExportOptions <- function(myIO, png = TRUE, svg = TRUE, pdf = TRUE,
                             clipboard = TRUE, csv = TRUE, title = NULL) {
  assert_myIO(myIO)
  myIO$x$config$export <- list(
    png = png, svg = svg, pdf = pdf,
    clipboard = clipboard, csv = csv, title = title
  )
  myIO
}
