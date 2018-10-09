#' suppressAxis()
#'
#' Suppresses legend from printing
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a logical operator defining whether the x axis should be printed or not
#' @param yAxis a logical operator defining whether the y axis should be printed or not
#'
#' @return the same myIO object
#'
#' @export
suppressAxis <- function(myIO, xAxis = NULL, yAxis = NULL){

  suppressAxis <- list(xAxis = xAxis, yAxis = yAxis)
  myIO$x$options$suppressAxis <- suppressAxis

  return(myIO)
}
