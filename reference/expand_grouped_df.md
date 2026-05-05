# Expand a grouped data frame into per-group layers

When a `grouped_df` (from
[`dplyr::group_by()`](https://dplyr.tidyverse.org/reference/group_by.html))
is passed to
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md),
this function splits the data by group and recursively calls
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
once per group, assigning auto-colors from the Okabe-Ito palette.

## Usage

``` r
expand_grouped_df(myIO, type, color, label, data, mapping, transform, options)
```

## Arguments

- myIO:

  a myIO htmlwidget

- type:

  layer type

- color:

  optional color vector; recycled across groups

- label:

  base label; group values are appended

- data:

  a grouped_df

- mapping:

  aesthetic mapping list

- transform:

  transform name

- options:

  layer options

## Value

The modified myIO widget with one layer per group.
