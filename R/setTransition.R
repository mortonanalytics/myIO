#' Configure Chart Transitions
#'
#' Sets the duration, easing, and per-element stagger for the enter/update/exit
#' animations used across chart layers. All arguments are optional; any left
#' \code{NULL} keeps the chart's current behavior, so this setter is fully
#' additive and backward compatible.
#'
#' Animation remains fully opt-out-able: \code{duration = 0} (or
#' \code{\link{setTransitionSpeed}(0)}) disables animation, and easing and
#' stagger automatically no-op whenever the effective duration is 0 — including
#' when the viewer's system requests \code{prefers-reduced-motion: reduce}.
#'
#' @param myIO an htmlwidget object created by the \code{\link{myIO}()} function
#' @param duration transition duration in milliseconds (\code{>= 0}). Set to 0
#'   to disable animation.
#' @param easing easing function name, one of \code{"linear"}, \code{"quad"},
#'   \code{"cubic"}, \code{"sin"}, \code{"exp"}, \code{"circle"}, \code{"back"},
#'   \code{"bounce"}, or \code{"elastic"} (mapped to the corresponding 'd3.js'
#'   easing). When \code{NULL}, each renderer keeps its built-in default easing.
#' @param stagger per-element delay in milliseconds (\code{>= 0}) applied across
#'   a layer's joined elements, creating a cascade. \code{0} disables stagger.
#'
#' @return A modified \code{myIO} htmlwidget object with updated transition
#'   settings.
#'
#' @seealso \code{\link{setTransitionSpeed}} for the duration-only shorthand.
#'
#' @examples
#' # Slower transitions with a bouncing ease and a 25ms cascade
#' myIO() |> setTransition(duration = 1200, easing = "bounce", stagger = 25)
#'
#' # Change only the easing
#' myIO() |> setTransition(easing = "cubic")
#'
#' # Disable animation entirely
#' myIO() |> setTransition(duration = 0)
#'
#' @export

setTransition <- function(myIO, duration = NULL, easing = NULL, stagger = NULL) {
  assert_myIO(myIO)

  if (!is.null(duration)) {
    check_number(duration, "duration", "setTransition")
    if (duration < 0) {
      stop("setTransition(): `duration` must be >= 0, not ", duration, ".",
           call. = FALSE)
    }
    myIO$x$config$transitions$speed <- duration
  }

  if (!is.null(easing)) {
    easing_choices <- c("linear", "quad", "cubic", "sin", "exp", "circle",
                        "back", "bounce", "elastic")
    check_choice(easing, easing_choices, "easing", "setTransition")
    myIO$x$config$transitions$easing <- easing
  }

  if (!is.null(stagger)) {
    check_number(stagger, "stagger", "setTransition")
    if (stagger < 0) {
      stop("setTransition(): `stagger` must be >= 0, not ", stagger, ".",
           call. = FALSE)
    }
    myIO$x$config$transitions$stagger <- stagger
  }

  return(myIO)
}
