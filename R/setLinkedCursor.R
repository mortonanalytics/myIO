#' Toggle Linked Cursor Sync on a myIO Widget
#'
#' Enables or disables synchronized hover crosshair across linked charts.
#' Composable with \code{\link{linkCharts}} and \code{\link{setLinked}} via
#' the pipe: call after linking to opt into cursor sync without re-linking.
#' Preserves any existing \code{interactions$linked} configuration.
#'
#' @param myIO A myIO htmlwidget.
#' @param enabled Logical. \code{TRUE} to turn cursor sync on,
#'   \code{FALSE} to turn it off. Default \code{TRUE}.
#' @param axis Character. Which axis to sync: \code{"x"} (default),
#'   \code{"y"}, or \code{"xy"}. Only \code{"x"} is rendered; the other
#'   values are accepted and persisted but currently have no visible effect.
#'
#' @return A modified \code{myIO} htmlwidget.
#' @examples
#' \donttest{
#' w1 <- myIO() |>
#'   addIoLayer(type = "point", label = "a",
#'     data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
#' w2 <- myIO() |>
#'   addIoLayer(type = "point", label = "b",
#'     data = mtcars, mapping = list(x_var = "hp", y_var = "mpg"))
#' linked <- linkCharts(w1, w2, on = "cyl")
#' linked[[1]] <- setLinkedCursor(linked[[1]])
#' linked[[2]] <- setLinkedCursor(linked[[2]])
#' }
#'
#' @export
setLinkedCursor <- function(myIO, enabled = TRUE, axis = "x") {
  assert_myIO(myIO)
  check_flag(enabled, "enabled", "setLinkedCursor")
  check_choice(axis, c("x", "y", "xy"), "axis", "setLinkedCursor")

  existing <- myIO$x$config$interactions$linked
  if (is.null(existing)) existing <- list()
  existing$cursor <- enabled
  existing$cursorAxis <- axis
  myIO$x$config$interactions$linked <- existing
  myIO
}
