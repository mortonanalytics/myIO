#' Set Transition Speed
#'
#' Sets transition speeds across the chart (set to 0 to suppress)
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param speed a number indicating the speed of transition in milliseconds
#'
#' @return A modified \code{myIO} htmlwidget object with updated transition
#'   speed.
#'
#' @seealso \code{\link{setTransition}} to also configure easing and stagger.
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
  setTransition(myIO, duration = speed)
}
