#' Update a myIO chart in place from the Shiny server
#'
#' `myIOProxy()` creates a lightweight handle to an already-rendered myIO widget,
#' and `updateMyIOData()` swaps the data of one or more existing layers without
#' re-rendering the whole widget. Unlike re-executing `renderMyIO()` (which
#' destroys and recreates the chart on every reactive invalidation, dropping
#' brush/zoom/toggle state and flickering), a proxy update reuses the existing
#' data-join path: only the changed marks transition, and interaction state is
#' preserved.
#'
#' Layers are matched by their `label`. Unknown labels are ignored client-side.
#' The supplied data frame replaces the layer's data as-is (the identity data
#' path); statistical transforms attached at `addIoLayer()` time are not
#' re-applied, so pass already-transformed data for transformed layers.
#'
#' @param outputId The output id of the `myIOOutput()` whose chart to update.
#' @param session The Shiny session object. Defaults to the current reactive
#'   domain.
#' @param proxy A `myIO_proxy` object from `myIOProxy()`.
#' @param ... One or more `label = data.frame` updates, where `label` is an
#'   existing layer label and the data frame carries that layer's mapped columns.
#'
#' @return `myIOProxy()` returns a `myIO_proxy` object; `updateMyIOData()`
#'   returns the proxy invisibly.
#'
#' @examples
#' \dontrun{
#' library(shiny)
#' ui <- fluidPage(myIOOutput("chart"), actionButton("go", "Resample"))
#' server <- function(input, output, session) {
#'   output$chart <- renderMyIO({
#'     myIO(data = data.frame(x = 1:50, y = rnorm(50))) |>
#'       addIoLayer("line", label = "series", mapping = list(x_var = "x", y_var = "y"))
#'   })
#'   observeEvent(input$go, {
#'     myIOProxy("chart") |>
#'       updateMyIOData(series = data.frame(x = 1:50, y = rnorm(50)))
#'   })
#' }
#' shinyApp(ui, server)
#' }
#'
#' @export
myIOProxy <- function(outputId, session = NULL) {
  if (!requireNamespace("shiny", quietly = TRUE)) {
    stop("myIOProxy() requires the 'shiny' package.", call. = FALSE)
  }
  check_string(outputId, "outputId", "myIOProxy")
  if (is.null(session)) {
    session <- shiny::getDefaultReactiveDomain()
  }
  if (is.null(session)) {
    stop("myIOProxy() must be called from within a Shiny session.", call. = FALSE)
  }
  structure(
    list(id = session$ns(outputId), session = session),
    class = "myIO_proxy"
  )
}

#' @rdname myIOProxy
#' @export
updateMyIOData <- function(proxy, ...) {
  if (!inherits(proxy, "myIO_proxy")) {
    stop("updateMyIOData(): `proxy` must be a myIOProxy() object.", call. = FALSE)
  }
  updates <- list(...)
  labels <- names(updates)
  if (length(updates) == 0L || is.null(labels) || any(labels == "")) {
    stop("updateMyIOData(): supply one or more named `label = data.frame` updates.",
         call. = FALSE)
  }

  layers <- lapply(labels, function(label) {
    data <- updates[[label]]
    if (!is.data.frame(data)) {
      stop("updateMyIOData(): update for layer '", label,
           "' must be a data frame.", call. = FALSE)
    }
    list(label = label, data = as_layer_rows(ensure_source_key(data)))
  })

  proxy$session$sendCustomMessage(
    "myio:proxy-update",
    list(id = proxy$id, layers = layers)
  )
  invisible(proxy)
}

#' Update layer options of a myIO chart in place from the Shiny server
#'
#' `updateMyIOOptions()` merges new options into one or more existing layers of
#' a rendered chart and redraws it, without re-running `renderMyIO()`. Only the
#' supplied option names change; every other option keeps its current value.
#'
#' Each chart type decides what to keep across the redraw. A field chart keeps
#' its playback time, play state, speed, selected player, hidden teams, labels,
#' trail length and metric window when the update leaves `pitchLength`,
#' `pitchWidth` and `maxGap` unchanged; a new `metricWindow` replaces the kept
#' window. Changing pitch size or `maxGap` starts the field chart over. Other
#' chart types redraw from the new options.
#'
#' Layers are matched by their `label`. Unknown labels are ignored client-side.
#' Field options (`overlays`, `minPlayers`, `excludeEntities`, `metricWindow`,
#' `events`) are checked the same way `addIoLayer()` checks them.
#'
#' @param proxy A `myIO_proxy` object from [myIOProxy()].
#' @param ... One or more `label = list(...)` updates, where `label` is an
#'   existing layer label and the list holds the option names and new values.
#'
#' @return The proxy, invisibly.
#'
#' @examples
#' \dontrun{
#' observeEvent(input$overlays, {
#'   myIOProxy("field") |>
#'     updateMyIOOptions(match = list(overlays = list(shape = "shape" %in% input$overlays)))
#' })
#' }
#'
#' @export
updateMyIOOptions <- function(proxy, ...) {
  if (!inherits(proxy, "myIO_proxy")) {
    stop("updateMyIOOptions(): `proxy` must be a myIOProxy() object.", call. = FALSE)
  }
  updates <- list(...)
  labels <- names(updates)
  if (length(updates) == 0L || is.null(labels) || any(labels == "")) {
    stop("updateMyIOOptions(): supply one or more named `label = list(...)` updates.",
         call. = FALSE)
  }

  layers <- lapply(labels, function(label) {
    options <- updates[[label]]
    keys <- names(options)
    if (!is.list(options) || is.data.frame(options) || length(options) == 0L ||
        is.null(keys) || any(keys == "")) {
      stop("updateMyIOOptions(): update for layer '", label,
           "' must be a named list of options.", call. = FALSE)
    }
    list(label = label, options = validate_field_options(options, "updateMyIOOptions"))
  })

  proxy$session$sendCustomMessage(
    "myio:proxy-options",
    list(id = proxy$id, layers = layers)
  )
  invisible(proxy)
}
