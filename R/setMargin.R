#' setMargin()
#'
#' Sets margins for the top, bottom, left, and right sides of the chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param top a numeric value representing in pixels the top margin
#' @param bottom a numeric value representing in pixels the bottom margin
#' @param left a numeric value representing in pixels the left margin
#' @param right a numeric value representing in pixels the right margin
#'
#' @return the same myIO object
#'
#' @export
setmargin <- function(myIO, top = 20, bottom = 40, left = 50, right = 50){

  myIO$x$options$margin$top <- top
  myIO$x$options$margin$bottom <- bottom
  myIO$x$options$margin$left <- left
  myIO$x$options$margin$right <- right

  return(myIO)
}
