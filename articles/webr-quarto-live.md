# WebR 0.6.0 and Quarto Live

myIO 1.3.0 has a pinned end-to-end compatibility gate for WebR 0.6.0.
The claim is deliberately specific: CI cross-compiles myIO and its
dependencies as WebAssembly packages, loads
[`library(myIO)`](https://mortonanalytics.github.io/myIO/), creates a
point chart in R, transfers the serialized htmlwidget payload, and
renders that payload with the production myIO bundle in Chromium. The
gate requires a visible SVG, the expected marks, and no R, page, or
console errors.

This does not claim that DuckDB-WASM, every browser engine, or every
host framework has been validated. Those remain separate compatibility
surfaces.

## Why a Wasm package repository is required

WebR cannot install an R package from source in the browser. Custom
packages must be compiled for WebAssembly first and made available
through a compatible binary repository. myIO uses the official
[`r-wasm/actions/build-rwasm@v3`](https://github.com/r-wasm/actions/tree/main/build-rwasm)
path in CI. See the WebR documentation on [building R
packages](https://docs.r-wasm.org/webr/latest/building.html) for the
underlying constraint and supported distribution model.

## Quarto Live setup

[Quarto Live](https://r-wasm.github.io/quarto-live/) uses WebR to
execute R blocks in the reader’s browser and supports htmlwidget output.
Install the extension in a Quarto project:

``` bash
quarto add r-wasm/quarto-live
```

Then configure the document to use the same WebR release tested by myIO.
The Morton Analytics R-universe is a CRAN-like repository that publishes
Wasm binaries; confirm that it carries myIO 1.3.0 before publishing the
document.

``` yaml
---
title: "myIO in the browser"
format: live-html
webr:
  engine-url: https://webr.r-wasm.org/v0.6.0/
  packages:
    - myIO
  repos:
    - https://mortonanalytics.r-universe.dev
---
```

Quarto Live documents using the `knitr` engine also need its documented
setup include. Follow the current [Quarto Live installation
instructions](https://r-wasm.github.io/quarto-live/getting_started/installation.html)
for that project-level configuration.

An interactive block can then create a standard small-data widget:

```` markdown
```{webr}
library(myIO)
stopifnot(packageVersion("myIO") >= "1.3.0")

myIO(mtcars) |>
  addIoLayer(
    type = "point",
    label = "Cars",
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  setAxisFormat(xLabel = "Weight", yLabel = "Miles per gallon")
```
````

The [`stopifnot()`](https://rdrr.io/r/base/stopifnot.html) check
prevents an older repository snapshot from silently supporting a
publication claim intended for 1.3.0. Quarto Live documents can
configure custom repositories through `webr.repos`; its [package-loading
guide](https://r-wasm.github.io/quarto-live/getting_started/packages.html)
describes the same precompiled-package pattern.

## Supported boundary

The verified 1.3.0 path covers the pure-R configuration and transform
layer, htmlwidget payload creation, production JavaScript bundle, SVG
rendering, and keyframe configuration. It does not exercise the optional
Arrow, DuckDB-WASM, WebGL, Shiny server, or Crosstalk paths inside WebR.
Use the normal R, Shiny, and browser test matrices for those
capabilities rather than treating WebR compatibility as a blanket
runtime guarantee.
