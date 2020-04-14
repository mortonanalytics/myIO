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
#' @export
setReferenceLines <- function(myIO, xRef =  0, yRef =  0){

  final <- list(
    x = xRef,
    y = yRef
    )

  myIO$x$options$referenceLine <- final

  return(myIO)
}
