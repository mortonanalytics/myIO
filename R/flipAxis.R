#' flipAxis()
#'
#' Function to flip the x and y axes
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param flipAxis a logical argument (TRUE) for flipping the x and y axes
#'
#' @return the same myIO object
#'
#' @examples
#' # Flip the axes for a horizontal bar chart
#' myIO() |>
#'   addIoLayer(
#'     type = "bar", color = "steelblue", label = "bars",
#'     data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")
#'   ) |>
#'   flipAxis()
#'
#' @export
flipAxis <- function(myIO, flipAxis = TRUE){
  assert_myIO(myIO)
  myIO$x$config$scales$flipAxis <- flipAxis
  return(myIO)
}
