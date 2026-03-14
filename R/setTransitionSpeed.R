#' setTransitionSpeed()
#'
#' Sets transition speeds across the chart (set to 0 to suppress)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param speed a number indicating the speed of transition in milliseconds
#'
#' @return the same myIO object
#'
#' @examples
#' # Set transition speed to 500ms
#' myIO() |> setTransitionSpeed(speed = 500)
#'
#' # Disable transitions
#' myIO() |> setTransitionSpeed(speed = 0)
#'
#' @export

setTransitionSpeed <- function(myIO, speed){
  assert_myIO(myIO)

  myIO$x$config$transitions$speed <- speed

  return(myIO)
}
