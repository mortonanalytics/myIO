#' Suppress Legend Display
#'
#' Suppresses legend from printing
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param suppressLegend a logical operator defining whether the legend should be printed or not
#'
#' @return A modified \code{myIO} htmlwidget object with legend display
#'   suppressed.
#'
#' @examples
#' # Hide the legend
#' myIO() |> suppressLegend()
#'
#' @export
suppressLegend <- function(myIO, suppressLegend = TRUE){
  assert_myIO(myIO)

  myIO$x$config$layout$suppressLegend <- suppressLegend

  return(myIO)
}
