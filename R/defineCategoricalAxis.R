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
#' @examples
#' # Define x axis as categorical
#' myIO() |> defineCategoricalAxis(xAxis = TRUE)
#'
#' # Define both axes as categorical
#' myIO() |> defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE)
#'
#' @export
defineCategoricalAxis <- function(myIO, xAxis = TRUE, yAxis = FALSE){
  myIO$x$config$scales$categoricalScale$xAxis <- xAxis
  myIO$x$config$scales$categoricalScale$yAxis <- yAxis
  return(myIO)
}
