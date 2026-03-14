#' dragPoints()
#'
#' Function to make points draggable
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param dragPoints a logical argument (TRUE) for creating draggable points
#'
#' @return the same myIO object
#'
#' @examples
#' # Enable draggable points
#' myIO() |>
#'   addIoLayer(
#'     type = "point", color = "red", label = "pts",
#'     data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")
#'   ) |>
#'   dragPoints()
#'
#' @export
dragPoints <- function(myIO, dragPoints = TRUE){
  assert_myIO(myIO)
  myIO$x$config$interactions$dragPoints <- dragPoints
  return(myIO)
}
