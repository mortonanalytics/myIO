#' dragPoints()
#'
#' Function to make points draggable
#'
#' @export
dragPoints <- function(myIO, dragPoints = TRUE){
  myIO$x$options$dragPoints <- dragPoints
  return(myIO)
}
