#' flipAxis()
#'
#' Function to flip the x and y axes
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param flipAxis a logical argument (TRUE) for flipping the x and y axes
#'
#' @return the same myIO object
#'
#' @export
flipAxis <- function(myIO, flipAxis = TRUE){
  myIO$x$options$flipAxis <- flipAxis
  return(myIO)
}
