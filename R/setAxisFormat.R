#' Set Axis Format
#'
#' Sets axis for x axis, y axis, and/or tool tip
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis Optional string indicating a d3.js format for the x axis.
#'   When \code{NULL}, leaves the existing setting unchanged.
#' @param yAxis Optional string indicating a d3.js format for the y axis.
#'   When \code{NULL}, leaves the existing setting unchanged.
#' @param toolTip Optional string indicating a d3.js format for tooltips.
#'   When \code{NULL}, leaves the existing setting unchanged.
#' @param xLabel Optional string label for the x axis. When \code{NULL},
#'   leaves the existing setting unchanged.
#' @param yLabel Optional string label for the y axis. When \code{NULL},
#'   leaves the existing setting unchanged.
#'
#' @return A modified \code{myIO} htmlwidget object with updated axis format
#'   configuration. with options set for the tooltip formats
#'
#' @examples
#' # Set axis formats using d3.js format strings
#' myIO() |> setAxisFormat(xAxis = ".0f", yAxis = ".1f")
#'
#' # Set axis labels
#' myIO() |> setAxisFormat(xLabel = "Weight (lbs)", yLabel = "MPG")
#'
#' # Label-only calls preserve previously configured formats
#' myIO() |> setAxisFormat(yAxis = ".2f") |> setAxisFormat(yLabel = "Rate")
#'
#' @export
setAxisFormat <- function(myIO, xAxis = NULL, yAxis = NULL, toolTip = NULL, xLabel = NULL, yLabel = NULL){
  assert_myIO(myIO)

  if (!is.null(xAxis)) {
    myIO$x$config$axes$xAxisFormat <- xAxis
  }
  if (!is.null(yAxis)) {
    myIO$x$config$axes$yAxisFormat <- yAxis
  }
  if (!is.null(toolTip)) {
    myIO$x$config$axes$toolTipFormat <- toolTip
  }
  if (!is.null(xLabel)) {
    myIO$x$config$axes$xAxisLabel <- xLabel
  }
  if (!is.null(yLabel)) {
    myIO$x$config$axes$yAxisLabel <- yLabel
  }

  return(myIO)
}
