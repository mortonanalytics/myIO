library(shiny)

# Browser -> R: custom input handler for the "myio.query" input type.
# The JS side calls Shiny.setInputValue("myio_query", {...}, {priority:"event"}).
# Shiny looks up the handler by the "inputType" suffix registered against
# that input name via the input's type attribute; we wire it generically by
# registering a handler and then invoking it from a reactive observer.
shiny::registerInputHandler("myio.query", function(value, session, name) {
  value  # pass through; validation happens in observer
}, force = TRUE)

ui <- fluidPage(
  tags$head(tags$script(src = "app.js")),
  tags$div(id = "myio-status", "waiting")
)

server <- function(input, output, session) {
  observeEvent(input$myio_query, {
    v <- input$myio_query
    ok <- is.list(v) &&
      identical(as.integer(v$v), 1L) &&
      is.character(v$queryId) &&
      identical(v$templateId, "test") &&
      identical(v$sourceId, "test") &&
      is.list(v$bindings)
    if (!ok) return(invisible())
    session$sendCustomMessage("myio:end", list(
      v = 1L,
      type = "myio:end",
      queryId = v$queryId,
      rowCount = 0L,
      elapsedMs = 0L
    ))
  }, ignoreInit = TRUE)
}

shinyApp(ui, server)
