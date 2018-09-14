#' setAxisFormat()
#'
#' Sets axis for x axis, y axis, and/or tool tip
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a string indicating a d3.js format
#' @param yAxis a string indicating a d3.js format
#' @param toolTip a string indicating a d3.js format
#'
#' @return the same myIO object with options set for the tooltip formats
#'
#' @export
setAxisFormat <- function(myIO, xAxis = NULL, yAxis = NULL, toolTip = NULL){

  myIO$x$options$xAxisFormat <- xAxis
  myIO$x$options$yAxisFormat <- yAxis
  myIO$x$options$toolTipFormat <- toolTip

  return(myIO)
}
