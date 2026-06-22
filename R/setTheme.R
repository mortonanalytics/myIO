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
#' @param preset Character or NULL. Named theme preset applied as a complete
#'   palette. One of \code{"light"}, \code{"dark"}, \code{"midnight"},
#'   \code{"ocean"}, \code{"forest"}, \code{"sunset"}, \code{"monochrome"},
#'   \code{"neon"}, \code{"corporate"}, \code{"academic"}, \code{"nature"},
#'   \code{"minimal"}, \code{"retro"}, or \code{"warm"}. Unrecognized values are
#'   ignored. Default NULL.
#' @param overrides Named list of CSS custom property overrides
#'   (e.g., \code{list("--chart-tooltip-bg" = "#222")}).
#' @param ... additional CSS custom property overrides; only names with a
#'   \code{--} prefix are applied. Other names are ignored with a warning.
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
    check_choice(mode, c("light", "dark", "auto"), "mode", "setTheme")
  }

  # Existing behavior: named args -> theme values (with -- prefix)
  values <- list()
  if (!is.null(text_color)) values[["--chart-text-color"]] <- text_color
  if (!is.null(grid_color)) values[["--chart-grid-color"]] <- grid_color
  if (!is.null(bg)) values[["--chart-bg"]] <- bg
  if (!is.null(font)) values[["--chart-font"]] <- font

  # Legacy ... args (backward compat): only `--`-prefixed names are applied.
  dots <- list(...)
  ignored <- character(0)
  for (name in names(dots)) {
    if (startsWith(name, "--")) {
      values[[name]] <- dots[[name]]
    } else {
      ignored <- c(ignored, name)
    }
  }
  if (length(ignored) > 0) {
    known <- c("text_color", "grid_color", "bg", "font", "mode", "preset")
    hints <- vapply(ignored, function(nm) {
      hit <- known[startsWith(known, substr(nm, 1, 3))]
      if (length(hit)) paste0(" Did you mean `", hit[1], "`?") else ""
    }, character(1))
    warning("setTheme(): ignoring unknown argument(s) ",
            paste0("`", ignored, "`", collapse = ", "),
            ". CSS overrides must use a `--` prefix.",
            paste0(hints, collapse = ""), call. = FALSE)
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
