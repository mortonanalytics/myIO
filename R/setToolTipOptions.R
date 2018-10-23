#' setToolTipOptions()
#'
#' Generic function for setting tool tip options for a chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param suppressY a boolean
#'
#' @return the same myIO object with options set for the tooltip formats
#'
#' @export
setToolTipOptions <- function(myIO, suppressY = NULL){

  myIO$x$options$toolTipOptions$suppressY <- suppressY


  return(myIO)
}
