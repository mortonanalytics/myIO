#' defineCategoricalAxis()
#'
#' Function to define the x variable as categorical
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param categoricalScale a logical argument (TRUE) for defining the x as categrocial
#'
#' @return the same myIO object
#'
#' @export
defineCategoricalAxis <- function(myIO, categoricalScale = TRUE){
  myIO$x$options$categoricalScale <- categoricalScale
  return(myIO)
}
