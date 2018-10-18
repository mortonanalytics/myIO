#' addAxisLabel()
#'
#' Suppresses axes from printing
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a string label to be printed along the x axis
#' @param yAxis a string label to be printedalong the y axis
#'
#' @return the same myIO object
#'
#' @export
addAxisLabel <- function(myIO, xAxis = NULL, yAxis = NULL){

  axisLabel <- list(xAxis = xAxis, yAxis = yAxis)
  myIO$x$options$axisLabelOption <- axisLabel

  return(myIO)
}
