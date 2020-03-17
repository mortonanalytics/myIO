#' defineCategoricalAxis()
#'
#' Function to define the x variable as categorical
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a logical argument (TRUE) for defining the x axis as categrocial
#' @param yAxis a logical argument (TRUE) for defining the y axis as categrocial
#'
#' @return the same myIO object
#'
#' @export
defineCategoricalAxis <- function(myIO, xAxis = TRUE, yAxis = FALSE){
  myIO$x$options$categoricalScale$xAxis <- xAxis
  myIO$x$options$categoricalScale$yAxis <- yAxis
  return(myIO)
}
