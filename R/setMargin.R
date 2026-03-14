#' setMargin()
#'
#' Sets margins for the top, bottom, left, and right sides of the chart
#'
#' @name setMargin
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param top a numeric value representing in pixels the top margin
#' @param bottom a numeric value representing in pixels the bottom margin
#' @param left a numeric value representing in pixels the left margin
#' @param right a numeric value representing in pixels the right margin
#' @return the same myIO object
#'
#' @examples
#' # Set custom margins
#' myIO() |> setMargin(top = 50, bottom = 80, left = 60, right = 20)
#'
#' @export
setMargin <- function(myIO, top = 20, bottom = 40, left = 50, right = 50){

  myIO$x$config$layout$margin$top <- top
  myIO$x$config$layout$margin$bottom <- bottom
  myIO$x$config$layout$margin$left <- left
  myIO$x$config$layout$margin$right <- right

  return(myIO)
}
