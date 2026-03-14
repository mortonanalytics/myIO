#' setAxisLimits()
#'
#' Sets margins for the top, bottom, left, and right sides of the chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xlim a list of min and max values
#' @param ylim a list of min and max values
#'
#' @return the same myIO object
#'
#' @examples
#' # Set x axis limits
#' myIO() |> setAxisLimits(xlim = list(min = 0, max = 100))
#'
#' # Set both axis limits
#' myIO() |> setAxisLimits(
#'   xlim = list(min = 0, max = 50),
#'   ylim = list(min = -10, max = 200)
#' )
#'
#' @export
setAxisLimits <- function(myIO, xlim = list(min = NULL, max = NULL), ylim = list(min = NULL, max = NULL)){
  assert_myIO(myIO)

  myIO$x$config$scales$xlim <- xlim
  myIO$x$config$scales$ylim <- ylim

  return(myIO)
}
