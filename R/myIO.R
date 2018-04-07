#' myIO
#'
#' myIO R + d3.js project
#'
#' @import htmlwidgets
#' @import dplyr
#'
#' @export
myIO <- function(data = NULL, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    options = list(referenceLine = 0)
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
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, myIOOutput, env, quoted = TRUE)
}
