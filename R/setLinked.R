#' Enable Linked Brushing via Crosstalk
#'
#' Connects the chart to a Crosstalk SharedData object so that brush
#' selections propagate to other linked widgets.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param shared_data a \code{crosstalk::SharedData} object
#' @param mode \code{"source"}, \code{"target"}, or \code{"both"} (default)
#' @param filter if \code{TRUE}, Crosstalk filter operations hide
#'   non-matching points. Default \code{FALSE} (dim only).
#' @param key Optional character vector of row keys. When supplied, overrides
#'   the keys extracted from \code{shared_data}. Useful when the SharedData
#'   keys do not match the column used for cross-chart matching.
#' @param group Optional character string. When supplied, overrides the
#'   Crosstalk group name from \code{shared_data}, allowing manual control
#'   over which widgets share selections.
#' @param cursor Logical. When \code{TRUE}, a hover in any linked chart draws
#'   a synchronized crosshair on every sibling chart in the same group.
#'   Default \code{FALSE}.
#' @param cursorAxis Character. Which axis to sync: \code{"x"} (default),
#'   \code{"y"}, or \code{"xy"}. Only \code{"x"} is active in v1.2.
#'
#' @return A modified \code{myIO} htmlwidget with Crosstalk linking.
#' @examples
#' if (interactive() && requireNamespace("crosstalk", quietly = TRUE)) {
#'   shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
#'   myIO() |>
#'     addIoLayer(
#'       type = "point", label = "scatter",
#'       data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")
#'     ) |>
#'     setLinked(shared)
#' }
#'
#' @export
setLinked <- function(myIO, shared_data, mode = "both", filter = FALSE,
                      key = NULL, group = NULL, cursor = FALSE,
                      cursorAxis = "x") {
  assert_myIO(myIO)
  if (!requireNamespace("crosstalk", quietly = TRUE)) {
    stop("Package 'crosstalk' is required for linked brushing. ",
         "Install it with: install.packages('crosstalk')", call. = FALSE)
  }

  check_class(shared_data, "SharedData", "shared_data", "setLinked")
  check_choice(mode, c("source", "target", "both"), "mode", "setLinked")
  check_flag(cursor, "cursor", "setLinked")
  check_choice(cursorAxis, c("x", "y", "xy"), "cursorAxis", "setLinked")

  resolved_key <- if (!is.null(key)) key else shared_data$key()
  resolved_group <- if (!is.null(group)) group else shared_data$groupName()

  if (!is.null(key)) check_class(key, "character", "key", "setLinked")
  if (!is.null(group)) check_string(group, "group", "setLinked")

  myIO$x$config$interactions$linked <- list(
    enabled = TRUE,
    group = resolved_group,
    key = as.list(resolved_key),
    mode = mode,
    filter = filter,
    cursor = cursor,
    cursorAxis = cursorAxis
  )

  myIO$dependencies <- c(myIO$dependencies, crosstalk::crosstalkLibs())
  myIO
}
