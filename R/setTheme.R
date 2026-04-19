#' Set Chart Theme
#'
#' Sets chart theme tokens using CSS custom properties
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param text_color text and label color
#' @param grid_color grid line color
#' @param bg background color
#' @param font font family
#' @param mode Character or NULL. Theme mode: "light", "dark", or "auto".
#'   Default NULL (no mode, manual CSS vars only).
#' @param preset Character or NULL. Named preset (reserved for future use).
#'   Default NULL.
#' @param overrides Named list of CSS custom property overrides
#'   (e.g., \code{list("--chart-tooltip-bg" = "#222")}).
#' @param ... additional CSS custom property overrides with `--` prefix
#'
#' @return A modified \code{myIO} htmlwidget object with updated theme
#'   configuration.
#' @examples
#' myIO() |>
#'   setTheme(text_color = "#222222", grid_color = "#d9d9d9")
#'
#' myIO() |>
#'   setTheme(mode = "dark", bg = "#1a1a2e")
#'
#' @export
setTheme <- function(myIO, text_color = NULL, grid_color = NULL, bg = NULL,
                     font = NULL, mode = NULL, preset = NULL,
                     overrides = list(), ...) {
  assert_myIO(myIO)

  if (!is.null(mode)) {
    stopifnot(mode %in% c("light", "dark", "auto"))
  }

  # Existing behavior: named args -> theme values (with -- prefix)
  values <- list()
  if (!is.null(text_color)) values[["--chart-text-color"]] <- text_color
  if (!is.null(grid_color)) values[["--chart-grid-color"]] <- grid_color
  if (!is.null(bg)) values[["--chart-bg"]] <- bg
  if (!is.null(font)) values[["--chart-font"]] <- font

  # Legacy ... args (backward compat)
  dots <- list(...)
  for (name in names(dots)) {
    if (startsWith(name, "--")) {
      values[[name]] <- dots[[name]]
    }
  }

  # Explicit overrides
  values <- c(values, overrides)

  myIO$x$config$theme <- list(
    mode = mode,
    preset = preset,
    values = if (length(values) > 0) values else list()
  )
  myIO
}
