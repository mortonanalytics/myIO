# Live Shiny app for tests/playwright/shiny-server-engine.spec.ts.
# Usage: Rscript app.R <repo root> <port>
args <- commandArgs(trailingOnly = TRUE)
pkgload::load_all(args[[1]], quiet = TRUE)
library(shiny)

# The browser gets one placeholder row as layer data; every other point on the
# chart has to come back from R through the server engine.
big <- data.frame(x = as.numeric(1:250), y = sin((1:250) / 20))
placeholder <- big[1, ]

ui <- fluidPage(myIOOutput("chart", height = "300px"))
server <- function(input, output, session) {
  output$chart <- renderMyIO({
    myIO(engine = "server", unify_data_path = TRUE) |>
      addIoLayer(type = "point", label = "pts", data = placeholder,
                 mapping = list(x_var = "x", y_var = "y")) |>
      setBigData(big)
  })
}

shiny::runApp(shinyApp(ui, server), port = as.integer(args[[2]]),
              host = "127.0.0.1", launch.browser = FALSE)
