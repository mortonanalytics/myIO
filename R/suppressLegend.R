#' suppressLegend()
#'
#' Suppresses legend from printing
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param suppressLegend a logical operator defining whether the legend should be printed or not
#'
#' @return the same myIO object
#'
#' @examples
#' # Hide the legend
#' myIO() |> suppressLegend()
#'
#' @export
suppressLegend <- function(myIO, suppressLegend = TRUE){

  myIO$x$config$layout$suppressLegend <- suppressLegend

  return(myIO)
}
