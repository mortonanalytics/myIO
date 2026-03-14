#' setToggle()
#'
#' Sets toggle options for y_var and adds a toggle button for chart
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param variable a string indicating the variable name in data for toggle
#' @param format a string indicating the format for the toggled variable
#'
#' @return the same myIO object
#'
#' @examples
#' # Add a toggle button to switch y variable
#' myIO() |> setToggle(variable = "Percent", format = ".0%")
#'
#' @export

setToggle <- function(myIO, variable, format = NULL){

  final <- list(variable = variable, format = format)

  myIO$x$config$interactions$toggleY <- final

  return(myIO)
}
