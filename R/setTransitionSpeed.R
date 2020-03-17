#' setTransitionSpeed()
#'
#' Sets transition speeds across the chart (set to 0 to suppress)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param speed a number indicating the speed of transition in milliseconds
#'
#' @return the same myIO object
#'
#' @export

setTransitionSpeed <- function(myIO, speed){

  myIO$x$options$transition$speed <- speed

  return(myIO)
}
