#' dragPoints()
#'
#' Function to make points draggable
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param dragPoints a logical argument (TRUE) for creating draggable points
#'
#' @return the same myIO object
#'
#' @export
dragPoints <- function(myIO, dragPoints = TRUE){
  myIO$x$options$dragPoints <- dragPoints
  return(myIO)
}
