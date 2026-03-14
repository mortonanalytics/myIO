#' setTheme()
#'
#' Sets chart theme tokens using CSS custom properties
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param text_color text and label color
#' @param grid_color grid line color
#' @param bg background color
#' @param font font family
#' @param ... additional CSS custom property overrides without the `chart-` prefix
#'
#' @return the same myIO object
#' @examples
#' myIO() |>
#'   setTheme(text_color = "#222222", grid_color = "#d9d9d9")
#'
#' @export
setTheme <- function(myIO, text_color = NULL, grid_color = NULL, bg = NULL, font = NULL, ...) {
  assert_myIO(myIO)

  theme <- list(
    "chart-text-color" = text_color,
    "chart-grid-color" = grid_color,
    "chart-bg" = bg,
    "chart-font" = font
  )

  extras <- list(...)
  if (length(extras) > 0) {
    for (name in names(extras)) {
      theme[[paste0("chart-", name)]] <- extras[[name]]
    }
  }

  myIO$x$config$theme <- Filter(Negate(is.null), theme)
  myIO
}
