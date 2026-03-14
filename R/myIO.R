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
#' @export
myIO <- function(data = NULL, width = "100%", height = "400px", elementId = NULL) {
  validateCssDimension <- function(value, arg) {
    if (is.null(value) || (is.numeric(value) && length(value) == 1 && !is.na(value)) ||
        (is.character(value) && length(value) == 1 && !is.na(value))) {
      return(invisible(NULL))
    }
    stop("'", arg, "' must be NULL, a single number, or a single character CSS unit.", call. = FALSE)
  }

  validateCssDimension(width, "width")
  validateCssDimension(height, "height")

  x <- list(
    data = data,
    config = list(
      layers = list(),
      layout = list(
        margin = list(top = 30, bottom = 60, left = 50, right = 5),
        suppressLegend = FALSE,
        suppressAxis = list(xAxis = FALSE, yAxis = FALSE)
      ),
      scales = list(
        xlim = list(min = NULL, max = NULL),
        ylim = list(min = NULL, max = NULL),
        categoricalScale = list(xAxis = FALSE, yAxis = FALSE),
        flipAxis = FALSE,
        colorScheme = list(colors = c("steelblue", "orange"), domain = c("none"), enabled = FALSE)
      ),
      axes = list(
        xAxisFormat = "s",
        yAxisFormat = "s",
        xAxisLabel = NULL,
        yAxisLabel = NULL,
        toolTipFormat = "s"
      ),
      interactions = list(
        dragPoints = FALSE,
        toggleY = list(variable = NULL, format = NULL),
        toolTipOptions = list(suppressY = FALSE)
      ),
      transitions = list(speed = 1000),
      referenceLines = list(x = NULL, y = NULL)
    )
  )

  htmlwidgets::createWidget(
    name = "myIO",
    x,
    width = width,
    height = height,
    package = "myIO",
    elementId = elementId
  )
}

#' Shiny bindings for myIO
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit or a number.
#' @param expr An expression that generates a myIO
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression?
#'
#' @name myIO-shiny
#' @export
myIOOutput <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "myIO", width, height, package = "myIO")
}

#' @rdname myIO-shiny
#' @export
renderMyIO <- function(expr, env = parent.frame(), quoted = FALSE) {
  htmlwidgets::shinyRenderWidget(expr, myIOOutput, env, quoted = quoted)
}
