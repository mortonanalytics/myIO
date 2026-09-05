#' Add a Parameter Slider (Shiny Only)
#'
#' Adds a slider control below the chart. Read its Shiny input in the render
#' expression and pass the value to the transform option to recompute the chart.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param param Slider input name (e.g., \code{"ci_level"}, \code{"degree"}).
#'   Values are sent to \code{input$`myIO-{outputId}-slider-{param}`}.
#' @param label display label for the slider
#' @param min minimum value
#' @param max maximum value
#' @param value default value
#' @param step step size (default: \code{NULL} for auto)
#' @param debounce debounce delay in milliseconds (default: 200)
#'
#' @return A modified \code{myIO} htmlwidget with slider config attached.
#' @examples
#' \dontrun{
#' # In a Shiny server function:
#' output$chart <- renderMyIO({
#'   level <- input$`myIO-chart-slider-ci_level`
#'   if (is.null(level)) level <- 0.95
#'   myIO(data = mtcars) |>
#'     addIoLayer(
#'       type = "regression", label = "fit",
#'       mapping = list(x_var = "wt", y_var = "mpg"),
#'       options = list(level = level)
#'     ) |>
#'     setSlider("ci_level", "Confidence level", 0.80, 0.99, level, 0.01)
#' })
#' }
#'
#' @export
setSlider <- function(myIO, param, label, min, max, value, step = NULL,
                      debounce = 200) {
  assert_myIO(myIO)
  check_string(param, "param", "setSlider")
  check_string(label, "label", "setSlider")
  check_number(min, "min", "setSlider")
  check_number(max, "max", "setSlider")
  check_number(value, "value", "setSlider")
  if (min >= max) stop("setSlider(): `min` must be less than `max` (got min=", min, ", max=", max, ").", call. = FALSE)
  if (value < min || value > max) stop("setSlider(): `value` must be between `min` and `max` (got value=", value, ", range=[", min, ", ", max, "]).", call. = FALSE)
  check_number(debounce, "debounce", "setSlider")
  if (debounce <= 0) stop("setSlider(): `debounce` must be positive, not ", debounce, ".", call. = FALSE)

  if (is.null(myIO$x$config$interactions$sliders)) {
    myIO$x$config$interactions$sliders <- list()
  }
  myIO$x$config$interactions$sliders[[
    length(myIO$x$config$interactions$sliders) + 1L
  ]] <- list(
    param = param,
    label = label,
    min = min,
    max = max,
    value = value,
    step = step,
    debounce = debounce
  )
  myIO
}
