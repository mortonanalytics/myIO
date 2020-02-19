#' setColorScheme()
#'
#' Sets color scheme for a chart and the category names (optional)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param colorShceme a vector of colors in the order you want them used
#' @param setCategories an optional vector of names that will be mapped to the corresponding color in the colorScheme
#'
#' @return the same myIO object
#'
#' @export

setColorScheme <- function(myIO, colorShceme, setCategories = NULL){

  final <- list(colorShceme, setCategories, c("on"))

  myIO$x$options$colorScheme <- final
  return(myIO)
}
