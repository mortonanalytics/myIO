#' Enable Brush Selection
#'
#' Enables rectangle brush selection on the chart. When a user drags to
#' select a region, the selected data points are available as a reactive
#' input in Shiny or exportable in static HTML.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param direction brush direction: \code{"xy"} (default), \code{"x"},
#'   or \code{"y"}
#' @param on_select behavior in static mode: \code{"highlight"} (default)
#'   or \code{"export"} (scopes CSV download to selected points)
#'
#' @return A modified \code{myIO} htmlwidget object with brush interaction
#'   enabled.
#' @examples
#' myIO(data = mtcars) |>
#'   addIoLayer(
#'     type = "point", label = "pts",
#'     mapping = list(x_var = "wt", y_var = "mpg")
#'   ) |>
#'   setBrush()
#'
#' @export
setBrush <- function(myIO, direction = "xy", on_select = "highlight") {
  assert_myIO(myIO)
  direction <- match.arg(direction, c("xy", "x", "y"))
  on_select <- match.arg(on_select, c("highlight", "export"))
  myIO$x$config$interactions$brush <- list(
    enabled = TRUE,
    direction = direction,
    onSelect = on_select
  )
  myIO
}
