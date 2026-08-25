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
#' @param cursorAxis Character. Which axis to sync: \code{"x"} (default) draws
#'   a vertical rule at the hovered x value, \code{"y"} draws a horizontal rule
#'   at the hovered y value, and \code{"xy"} draws both. A rule is only drawn
#'   when the sibling chart can map the incoming value through its own scale.
#'
#' @details
#' Selections travel on the Crosstalk key space, so a myIO chart matches
#' rows against sibling widgets (\pkg{DT}, \pkg{plotly}, \pkg{leaflet}) by
#' the same keys they use. The keys are matched to the chart's rows by
#' position, which requires the data passed to \code{addIoLayer()} to be
#' \code{shared_data$data()} in its original row order. If a layer's row
#' count does not match the number of keys -- for example after re-filtering
#' the frame, or after \code{updateMyIOData()} replaced the rows -- the
#' chart falls back to matching within its own widget only, rather than
#' pairing keys with the wrong rows.
#'
#' @return A modified \code{myIO} htmlwidget with Crosstalk linking.
#' @seealso \code{\link{linkCharts}} for group-identifier linking that does
#'   not require Crosstalk (e.g. static R Markdown / Quarto HTML).
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
  myIO$x$config$crosstalk_threshold <- getOption("myIO.crosstalk_threshold", 100000L)
  myIO
}
