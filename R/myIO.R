#' myIO
#'
#' myIO R + d3.js project
#'
#' @importFrom htmlwidgets createWidget shinyWidgetOutput shinyRenderWidget
#'
#' @param data an optional point of entry for the data frame or vector
#' @param width a string of either pixel width or a percentage width
#' @param height a string of pixel height
#' @param elementId a unique id for the htmlwidget object
#'
#' @return the same myIO object
#'
#' @examples
#' # Create a basic widget
#' myIO()
#'
#' # Create with custom dimensions
#' myIO(width = "50%", height = "300px")
#'
#' # Create with data attached
#' myIO(data = mtcars)
#'
#' @export
myIO <- function(data = NULL, width = "100%", height = "400px", elementId = NULL) {
  validateCssDimension <- function(value, arg) {
    if (is.null(value)) {
      return(invisible(NULL))
    }

    if (is.numeric(value) && length(value) == 1 && !is.na(value)) {
      return(invisible(NULL))
    }

    if (is.character(value) && length(value) == 1 && !is.na(value)) {
      return(invisible(NULL))
    }

    stop(
      "'", arg, "' must be NULL, a single number, or a single character CSS unit.",
      call. = FALSE
    )
  }

  validateCssDimension(width, "width")
  validateCssDimension(height, "height")

  # forward options using x
  x = list(
    data = data,
    options = list(referenceLine = list(x = NULL, y = NULL),
                   transition = list(speed = 1000),
                   margin = list(top = 30,
                                 bottom = 60,
                                 left = 50,
                                 right = 5),
                   xlim = list(min = NULL,
                               max = NULL),
                   ylim = list(min = NULL,
                                max = NULL),
                   xAxisLabel = NULL,
                   yAxisLabel = NULL,
                   xAxisFormat = "s",
                   yAxisFormat = "s",
                   categoricalScale = list(xAxis = FALSE, yAxis = FALSE),
                   suppressLegend = FALSE,
                   colorScheme = list(c("steelblue", "orange"), c("none"), c("off")),
                   toolTipOptions = list(suppressY = FALSE),
                   suppressAxis = list(xAxis = FALSE, yAxis = FALSE)
                   )
  )


  # create widget
  htmlwidgets::createWidget(
    name = 'myIO',
    x,
    width = width,
    height = height,
    package = 'myIO',
    elementId = elementId
  )
}

#' Shiny bindings for myIO
#'
#' Output and render functions for using myIO within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a myIO
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name myIO-shiny
#'
#' @export
myIOOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'myIO', width, height, package = 'myIO')
}

#' @rdname myIO-shiny
#' @export
renderMyIO <- function(expr, env = parent.frame(), quoted = FALSE) {
  htmlwidgets::shinyRenderWidget(expr, myIOOutput, env, quoted = quoted)
}
