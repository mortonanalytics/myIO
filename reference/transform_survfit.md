# Kaplan-Meier survival transform

Computes the KM estimator, Greenwood CI, and censoring indicators from
raw time-to-event data. No dependency on the survival package.

## Usage

``` r
transform_survfit(data, mapping, options = list())
```

## Arguments

- data:

  Data frame with time and status columns.

- mapping:

  Named list; must contain \`time\` and \`status\`.

- options:

  List; \`level\` (default 0.95) controls CI width.

## Value

List with \`data\` (data.frame) and \`meta\`.
