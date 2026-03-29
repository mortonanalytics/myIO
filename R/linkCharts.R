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
#' @return A list of modified myIO widgets with matching link config.
#' @examples
#' if (interactive()) {
#'   w1 <- myIO() |>
#'     addIoLayer(type = "point", label = "scatter",
#'       data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
#'   w2 <- myIO() |>
#'     addIoLayer(type = "bar", label = "bars",
#'       data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg"))
#'   linked <- linkCharts(w1, w2, on = "cyl")
#' }
#'
#' @export
linkCharts <- function(..., on, group = NULL) {
  widgets <- list(...)
  if (length(widgets) < 2) {
    stop("linkCharts() requires at least 2 widgets.", call. = FALSE)
  }
  check_string(on, "on", "linkCharts")
  if (is.null(group)) group <- paste0("link_", as.integer(Sys.time()))
  check_string(group, "group", "linkCharts")
  for (i in seq_along(widgets)) {
    assert_myIO(widgets[[i]])
    widgets[[i]]$x$config$interactions$linked <- list(
      enabled = TRUE,
      keyColumn = on,
      group = group,
      mode = "bidirectional"
    )
  }
  widgets
}
