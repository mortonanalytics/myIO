# Update layer options of a myIO chart in place from the Shiny server

\`updateMyIOOptions()\` merges new options into one or more existing
layers of a rendered chart and redraws it, without re-running
\`renderMyIO()\`. Only the supplied option names change; every other
option keeps its current value.

## Usage

``` r
updateMyIOOptions(proxy, ...)
```

## Arguments

- proxy:

  A \`myIO_proxy\` object from \[myIOProxy()\].

- ...:

  One or more \`label = list(...)\` updates, where \`label\` is an
  existing layer label and the list holds the option names and new
  values.

## Value

The proxy, invisibly.

## Details

Each chart type decides what to keep across the redraw. A field chart
keeps its playback time, play state, speed, selected player, hidden
teams, labels, trail length and metric window when the update leaves
\`pitchLength\`, \`pitchWidth\` and \`maxGap\` unchanged; a new
\`metricWindow\` replaces the kept window. Changing pitch size or
\`maxGap\` starts the field chart over. Other chart types redraw from
the new options.

Layers are matched by their \`label\`. Unknown labels are ignored
client-side. Field options (\`overlays\`, \`minPlayers\`,
\`excludeEntities\`, \`metricWindow\`, \`events\`) are checked the same
way \`addIoLayer()\` checks them.

## Examples

``` r
if (FALSE) { # \dontrun{
observeEvent(input$overlays, {
  myIOProxy("field") |>
    updateMyIOOptions(match = list(overlays = list(shape = "shape" %in% input$overlays)))
})
} # }
```
