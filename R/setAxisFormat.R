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
#' @export
setAxisFormat <- function(myIO, xAxis = NULL, yAxis = NULL, toolTip = NULL, xLabel = NULL, yLabel = NULL){

  myIO$x$options$xAxisFormat <- xAxis
  myIO$x$options$yAxisFormat <- yAxis
  myIO$x$options$toolTipFormat <- toolTip
  myIO$x$options$xAxisLabel <- xLabel
  myIO$x$options$yAxisLabel <- yLabel

  return(myIO)
}
