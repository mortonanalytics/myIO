#' @noRd
sizingPolicy_myIO <- function() {
  htmlwidgets::sizingPolicy(
    defaultWidth    = "100%",
    defaultHeight   = 400,
    padding         = 0,
    browser.fill    = TRUE,
    browser.padding = 0,
    knitr.figure    = FALSE,
    viewer.fill     = TRUE,
    viewer.suppress = FALSE,
    fill            = TRUE
  )
}

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
#' @param sparkline Logical. If TRUE, renders a compact sparkline suitable for
#'   embedding in table cells. Strips axes, legend, and interactions.
#'   Only "line", "bar", and "area" layer types are supported. Default FALSE.
#' @param engine one of \code{"auto"} (default), \code{"server"}, \code{"wasm"}, or
#'   \code{"svg"}. Only consulted when big-data features are attached via
#'   \code{\link{setBigData}()}. With no big-data attachment, charts render
#'   identically to the small-data SVG path regardless of this argument. See
#'   \code{vignette("large-data-linking")}.
#'
#' @return An htmlwidget object of class \code{myIO}.
#' @examples
#' myIO(data = mtcars) |>
#'   setMargin(top = 40, bottom = 80, left = 60, right = 10)
#'
#' @export
myIO <- function(data = NULL, width = "100%", height = "400px", elementId = NULL,
                 sparkline = FALSE, engine = "auto") {
  validateCssDimension <- function(value, arg) {
    if (is.null(value) || (is.numeric(value) && length(value) == 1 && !is.na(value)) ||
        (is.character(value) && length(value) == 1 && !is.na(value))) {
      return(invisible(NULL))
    }
    stop("'", arg, "' must be NULL, a single number, or a single character CSS unit.", call. = FALSE)
  }

  engine <- match.arg(engine, c("auto", "server", "wasm", "svg"))

  validateCssDimension(width, "width")
  validateCssDimension(height, "height")

  x <- list(
    data = data,
    config = list(
      specVersion = 2L,
      sparkline = if (isTRUE(sparkline)) TRUE else NULL,
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
      referenceLines = list(x = NULL, y = NULL),
      engine = engine,
      coordinator_enabled = FALSE,
      crosstalk_threshold = getOption("myIO.crosstalk_threshold", 100000L),
      duckdb_wasm = list(cache_url = NULL, worker_url = NULL)
    ),
    bigdata = list(
      mode          = "none",
      source_id     = NULL,
      ipc_b64       = NULL,
      url           = NULL,
      schema        = NULL,
      row_count     = NULL,
      rowkey_col    = NULL
    ),
    coordinator = list(
      chart_id  = new_chart_id(),
      mark_spec = NULL
    )
  )

  if (isTRUE(sparkline)) {
    if (identical(height, "400px")) height <- 20
    if (identical(width, "100%")) width <- "100%"  # keep default
  }

  htmlwidgets::createWidget(
    name = "myIO",
    x,
    width = width,
    height = height,
    package = "myIO",
    elementId = elementId,
    sizingPolicy = sizingPolicy_myIO()
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

#' Diagnose myIO Rendering Errors
#'
#' Prints guidance on how to find the most recent JavaScript error from a
#' myIO widget. In Shiny, errors are available as reactive inputs. Outside
#' Shiny, errors appear in the browser's developer console.
#'
#' @param outputId optional Shiny output ID (character string). If provided,
#'   prints the exact Shiny input key to read.
#'
#' @return Invisibly returns \code{NULL}. Called for its side effect
#'   (printing diagnostic guidance).
#'
#' @examples
#' myIO_last_error()
#' myIO_last_error("chart1")
#'
#' @export
myIO_last_error <- function(outputId = NULL) {
  if (is.null(outputId)) {
    message("myIO: To debug rendering issues:\n",
            "  1. Open your browser's developer console (F12)\n",
            "  2. Look for warnings prefixed with [myIO]\n",
            "  3. In Shiny, read: input$`myIO-{outputId}-error`")
  } else {
    check_string(outputId, "outputId", "myIO_last_error")
    message("myIO: Read the last error for '", outputId, "' with:\n",
            "  input$`myIO-", outputId, "-error`\n\n",
            "Outside Shiny, open the browser console (F12) and look for:\n",
            "  [myIO] Layer '...' removed: ...\n",
            "  [myIO] Render error: ...")
  }
  invisible(NULL)
}
