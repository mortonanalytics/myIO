#' setAxisFormat()
#'
#' Sets axis for x axis, y axis, and/or tool tip
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a string indicating a d3.js format
#' @param yAxis a string indicating a d3.js format
#' @param toolTip a string indicating a d3.js format
#' @param xLabel a string label for axis
#' @param yLabel a string label for axis
#'
#' @return the same myIO object with options set for the tooltip formats
#'
#' @examples
#' # Set axis formats using d3.js format strings
#' myIO() |> setAxisFormat(xAxis = ".0f", yAxis = ".1f")
#'
#' # Set axis labels
#' myIO() |> setAxisFormat(xLabel = "Weight (lbs)", yLabel = "MPG")
#'
#' @export
setAxisFormat <- function(myIO, xAxis = "s", yAxis = "s", toolTip = "s", xLabel = NULL, yLabel = NULL){

  myIO$x$options$xAxisFormat <- xAxis
  myIO$x$options$yAxisFormat <- yAxis
  myIO$x$options$toolTipFormat <- toolTip
  myIO$x$options$xAxisLabel <- xLabel
  myIO$x$options$yAxisLabel <- yLabel

  return(myIO)
}
