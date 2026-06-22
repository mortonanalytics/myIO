# Update a myIO chart in place from the Shiny server

\`myIOProxy()\` creates a lightweight handle to an already-rendered myIO
widget, and \`updateMyIOData()\` swaps the data of one or more existing
layers without re-rendering the whole widget. Unlike re-executing
\`renderMyIO()\` (which destroys and recreates the chart on every
reactive invalidation, dropping brush/zoom/toggle state and flickering),
a proxy update reuses the existing data-join path: only the changed
marks transition, and interaction state is preserved.

## Usage

``` r
myIOProxy(outputId, session = NULL)

updateMyIOData(proxy, ...)
```

## Arguments

- outputId:

  The output id of the \`myIOOutput()\` whose chart to update.

- session:

  The Shiny session object. Defaults to the current reactive domain.

- proxy:

  A \`myIO_proxy\` object from \`myIOProxy()\`.

- ...:

  One or more \`label = data.frame\` updates, where \`label\` is an
  existing layer label and the data frame carries that layer's mapped
  columns.

## Value

\`myIOProxy()\` returns a \`myIO_proxy\` object; \`updateMyIOData()\`
returns the proxy invisibly.

## Details

Layers are matched by their \`label\`. Unknown labels are ignored
client-side. The supplied data frame replaces the layer's data as-is
(the identity data path); statistical transforms attached at
\`addIoLayer()\` time are not re-applied, so pass already-transformed
data for transformed layers.

## Examples

``` r
if (FALSE) { # \dontrun{
library(shiny)
ui <- fluidPage(myIOOutput("chart"), actionButton("go", "Resample"))
server <- function(input, output, session) {
  output$chart <- renderMyIO({
    myIO(data = data.frame(x = 1:50, y = rnorm(50))) |>
      addIoLayer("line", label = "series", mapping = list(x_var = "x", y_var = "y"))
  })
  observeEvent(input$go, {
    myIOProxy("chart") |>
      updateMyIOData(series = data.frame(x = 1:50, y = rnorm(50)))
  })
}
shinyApp(ui, server)
} # }
```
