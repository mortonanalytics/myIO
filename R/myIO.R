#' Create a myIO Chart Widget
#'
#' Create an interactive D3.js chart widget
#'
#' @importFrom htmlwidgets createWidget shinyWidgetOutput shinyRenderWidget
#' @importFrom utils modifyList
#'
#' @param data an optional point of entry for the data frame or vector
#' @param width a string of either pixel width or a percentage width
#' @param height a string of pixel height
#' @param elementId a unique id for the htmlwidget object
#'
#' @return An htmlwidget object of class \code{myIO}.
#' @examples
#' myIO(data = mtcars) |>
#'   setMargin(top = 40, bottom = 80, left = 60, right = 10)
#'
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
      specVersion = 1L,
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
        colorScheme = list(colors = OKABE_ITO_PALETTE, domain = c("none"), enabled = FALSE)
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
      theme = list(),
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

#' Shiny Bindings for myIO
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit or a number.
#' @param expr An expression that generates a myIO
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression?
#'
#' @return \code{myIOOutput} returns a Shiny UI element for placement in a UI
#'   definition. \code{renderMyIO} returns a Shiny render function for use in a
#'   server definition.
#' @examples
#' if (interactive()) {
#'   library(shiny)
#'   ui <- fluidPage(myIOOutput("chart"))
#'   server <- function(input, output) {
#'     output$chart <- renderMyIO({
#'       myIO(data = mtcars) |>
#'         addIoLayer(type = "point", label = "scatter",
#'           mapping = list(x_var = "wt", y_var = "mpg"))
#'     })
#'   }
#'   shinyApp(ui, server)
#' }
#'
#' @name myIO-shiny
#' @export
myIOOutput <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "myIO", width, height, package = "myIO")
}

#' @rdname myIO-shiny
#' @export
renderMyIO <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) {
    expr <- substitute(expr)
  }
  htmlwidgets::shinyRenderWidget(expr, myIOOutput, env, quoted = TRUE)
}
