#' Link Charts for Cross-Selection
#'
#' A convenience wrapper that sets matching link config on multiple widgets
#' so that brush selections propagate between them. Unlike \code{\link{setLinked}},
#' this does not require Crosstalk --- it uses a shared group identifier and key
#' column to coordinate selections across charts rendered in the same page.
#'
#' @param ... myIO widget objects to link.
#' @param on Character. Column name to match rows across charts.
#' @param group Character. Group identifier. Default auto-generated.
#' @param cursor Logical. When \code{TRUE}, a hover in any linked chart draws
#'   a synchronized crosshair (and optional tooltip) on every sibling chart
#'   in the same group. Default \code{FALSE}.
#' @param cursorAxis Character. Which axis to sync: \code{"x"} (default),
#'   \code{"y"}, or \code{"xy"}. Only \code{"x"} is active in v1.2; other
#'   values are accepted but not yet rendered.
#' @return A list of modified myIO widgets with matching link config.
#' @examples
#' \donttest{
#' w1 <- myIO() |>
#'   addIoLayer(type = "point", label = "scatter",
#'     data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
#' w2 <- myIO() |>
#'   addIoLayer(type = "bar", label = "bars",
#'     data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg"))
#' linked <- linkCharts(w1, w2, on = "cyl")
#' }
#'
#' @export
linkCharts <- function(..., on, group = NULL, cursor = FALSE, cursorAxis = "x") {
  widgets <- list(...)
  if (length(widgets) < 2) {
    stop("linkCharts() requires at least 2 widgets.", call. = FALSE)
  }
  check_string(on, "on", "linkCharts")
  if (is.null(group)) group <- paste0("link_", as.integer(Sys.time()))
  check_string(group, "group", "linkCharts")
  check_flag(cursor, "cursor", "linkCharts")
  check_choice(cursorAxis, c("x", "y", "xy"), "cursorAxis", "linkCharts")
  for (i in seq_along(widgets)) {
    assert_myIO(widgets[[i]])
    widgets[[i]]$x$config$interactions$linked <- list(
      enabled = TRUE,
      keyColumn = on,
      group = group,
      mode = "bidirectional",
      cursor = cursor,
      cursorAxis = cursorAxis
    )
  }
  widgets
}
