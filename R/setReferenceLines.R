#' setReferenceLines()
#'
#' Sets x and y reference lines
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param xRef a list of the reference line value of x
#' @param yRef a list of the reference line value of y
#'
#' @return the same myIO object
#'
#' @examples
#' # Add reference lines at x=5 and y=20
#' myIO() |> setReferenceLines(xRef = 5, yRef = 20)
#'
#' @export
setReferenceLines <- function(myIO, xRef =  0, yRef =  0){
  assert_myIO(myIO)

  final <- list(
    x = xRef,
    y = yRef
    )

  myIO$x$config$referenceLines <- final

  return(myIO)
}
