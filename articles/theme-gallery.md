# Theme Gallery

## Overview

myIO ships named theme presets that recolor the entire chart —
background, gridlines, text, tooltip, brush, and reference-line colors —
in one call:

``` r

myIO() |>
  addIoLayer(
    type = "point", label = "obs", data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  setTheme(preset = "midnight")
```

Each preview below is the same scatter-plus-trend chart rendered under a
different preset, so you can compare them directly. `"light"` and
`"dark"` are also available via `setTheme(mode = "light" | "dark")`.

``` r

myio_theme_presets <- c(
  "light", "dark", "midnight", "ocean", "forest", "sunset",
  "monochrome", "neon", "corporate", "academic", "nature",
  "minimal", "retro", "warm"
)
myio_theme_presets
#>  [1] "light"      "dark"       "midnight"   "ocean"      "forest"    
#>  [6] "sunset"     "monochrome" "neon"       "corporate"  "academic"  
#> [11] "nature"     "minimal"    "retro"      "warm"
```

## Live previews

## Custom overrides

Presets are a starting point. Layer your own CSS custom properties on
top with `setTheme(overrides = ...)` or the `--`-prefixed `...`
arguments:

``` r

myIO() |>
  addIoLayer(
    type = "point", label = "obs", data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  setTheme(
    preset = "midnight",
    overrides = list("--chart-annotation-ring" = "#22d3ee")
  )
```
