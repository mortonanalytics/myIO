#' setAxisLimits()
#'
#' Sets margins for the top, bottom, left, and right sides of the chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xlim a list of min and max values
#' @param ylim a list of min and max values
#'
#' @return the same myIO object
#'
#' @export
setAxisLimits <- function(myIO, xlim = list(min = NULL, max = NULL), ylim = list(min = NULL, max = NULL)){

  myIO$x$options$xlim <- xlim
  myIO$x$options$ylim <- ylim

  return(myIO)
}
