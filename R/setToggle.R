#' setToggle()
#'
#' Sets toggle options for y_var and adds a toggle button for chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param newY a string indicating the variable name in data for toggle
#'
#' @return the same myIO object
#'
#' @export

setToggle <- function(myIO, newY, newScaleY = NULL){

  final <- list(newY, newScaleY)

  myIO$x$options$toggleY <- final

  return(myIO)
}
