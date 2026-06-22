#' Enable Brush Selection
#'
#' Enables rectangle brush selection on the chart. When a user drags to
#' select a region, the selected data points are available as a reactive
#' input in Shiny or exportable in static HTML.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param direction brush direction: \code{"xy"} (default), \code{"x"},
#'   or \code{"y"}
#' @param onSelect behavior in static mode: \code{"highlight"} (default)
#'   or \code{"export"} (scopes CSV download to selected points)
#' @param on_select deprecated; use \code{onSelect}.
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
setBrush <- function(myIO, direction = "xy", onSelect = NULL, on_select = NULL) {
  assert_myIO(myIO)
  onSelect <- deprecated_alias(onSelect, on_select, "onSelect", "on_select", "setBrush")
  if (is.null(onSelect)) onSelect <- "highlight"
  check_choice(direction, c("xy", "x", "y"), "direction", "setBrush")
  check_choice(onSelect, c("highlight", "export"), "onSelect", "setBrush")
  myIO$x$config$interactions$brush <- list(
    enabled = TRUE,
    direction = direction,
    onSelect = onSelect
  )
  myIO
}
