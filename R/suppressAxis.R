#' suppressAxis()
#'
#' Suppresses axes from printing
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xAxis a logical operator defining whether the x axis should be printed or not
#' @param yAxis a logical operator defining whether the y axis should be printed or not
#'
#' @return the same myIO object
#'
#' @examples
#' # Suppress both axes
#' myIO() |> suppressAxis(xAxis = TRUE, yAxis = TRUE)
#'
#' # Suppress only the x axis
#' myIO() |> suppressAxis(xAxis = TRUE)
#'
#' @export
suppressAxis <- function(myIO, xAxis = NULL, yAxis = NULL){
  assert_myIO(myIO)

  suppressAxis <- list(xAxis = xAxis, yAxis = yAxis)
  myIO$x$config$layout$suppressAxis <- suppressAxis

  return(myIO)
}
