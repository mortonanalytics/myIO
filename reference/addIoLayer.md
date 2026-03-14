# addLayer()

Adds individual layer to a myIO widget

## Usage

``` r
addIoLayer(
  myIO,
  type,
  color = NULL,
  label,
  data = NULL,
  mapping,
  transform = "identity",
  options = list(barSize = "large", toolTipOptions = list(suppressY = FALSE))
)
```

## Arguments

- myIO:

  an htmlwidget object created by the \`myIO()\` function

- type:

  chart type

- color:

  optional CSS color string or vector for grouped layers

- label:

  unique layer label

- data:

  data frame backing the layer

- mapping:

  named aesthetic mapping list

- transform:

  transform name applied before serialization

- options:

  layer options passed through to the widget config
