#' setColorScheme()
#'
#' Sets color scheme for a chart and the category names (optional)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param colorScheme a vector of colors in the order you want them used
#' @param colorShceme a vector of colors in the order you want them used
#' @param setCategories an optional vector of names that will be mapped to the corresponding color in the colorScheme
#'
#' @return the same myIO object
#'
#' @examples
#' # Set a custom color scheme
#' myIO() |> setColorScheme(colorScheme = list("red", "blue", "green"))
#'
#' # Set colors with category labels
#' myIO() |> setColorScheme(
#'   colorScheme = list("steelblue", "orange"),
#'   setCategories = c("Group A", "Group B")
#' )
#'
#' @export

setColorScheme <- function(myIO, colorScheme = NULL, colorShceme = NULL, setCategories = NULL){
  if (!is.null(colorShceme)) {
    .Deprecated(new = "colorScheme", old = "colorShceme")
    if (is.null(colorScheme)) {
      colorScheme <- colorShceme
    }
  }

  if (is.null(colorScheme)) {
    stop("'colorScheme' must be provided.", call. = FALSE)
  }

  final <- list(colorScheme, setCategories, c("on"))

  myIO$x$options$colorScheme <- final
  return(myIO)
}
