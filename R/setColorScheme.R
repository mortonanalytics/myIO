#' setColorScheme()
#'
#' Sets color scheme for a chart and the category names (optional)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param colorScheme a vector of colors in the order you want them used
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

setColorScheme <- function(myIO, colorScheme = NULL, setCategories = NULL){
  assert_myIO(myIO)

  if (is.null(colorScheme)) {
    stop("'colorScheme' must be provided.", call. = FALSE)
  }

  final <- list(
    colors = unlist(colorScheme),
    domain = if (is.null(setCategories)) c("none") else setCategories,
    enabled = TRUE
  )

  myIO$x$config$scales$colorScheme <- final
  return(myIO)
}
