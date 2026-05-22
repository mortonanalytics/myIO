# Validate a myIO Chart Specification

Validates a proposed chart specification against the generated myIO
schema.

## Usage

``` r
myio_validate_spec(spec, columns = NULL)
```

## Arguments

- spec:

  A list with `type`, `mapping`, optional `transform`, and optional
  `columns`.

- columns:

  Optional named column type map. When supplied, overrides
  `spec$columns` and enables missing-column and numeric-column checks.

## Value

A list with `valid` and `errors`. Errors use stable machine-readable
`code` values.

## Examples

``` r
myio_validate_spec(list(
  type = "boxplot",
  mapping = list(column_var = "Species", value_var = "Sepal.Width")
))
#> $valid
#> [1] FALSE
#> 
#> $errors
#> $errors[[1]]
#> $errors[[1]]$code
#> [1] "MISSING_MAPPING"
#> 
#> $errors[[1]]$field
#> [1] "x_var"
#> 
#> $errors[[1]]$message
#> [1] "Missing required mapping 'x_var' for chart type 'boxplot'."
#> 
#> 
#> $errors[[2]]
#> $errors[[2]]$code
#> [1] "MISSING_MAPPING"
#> 
#> $errors[[2]]$field
#> [1] "y_var"
#> 
#> $errors[[2]]$message
#> [1] "Missing required mapping 'y_var' for chart type 'boxplot'."
#> 
#> 
#> $errors[[3]]
#> $errors[[3]]$code
#> [1] "UNKNOWN_MAPPING_KEY"
#> 
#> $errors[[3]]$field
#> [1] "column_var"
#> 
#> $errors[[3]]$message
#> [1] "Unknown mapping key 'column_var' for chart type 'boxplot'."
#> 
#> $errors[[3]]$suggestion
#> [1] "x_var"
#> 
#> 
#> $errors[[4]]
#> $errors[[4]]$code
#> [1] "UNKNOWN_MAPPING_KEY"
#> 
#> $errors[[4]]$field
#> [1] "value_var"
#> 
#> $errors[[4]]$message
#> [1] "Unknown mapping key 'value_var' for chart type 'boxplot'."
#> 
#> $errors[[4]]$suggestion
#> [1] "y_var"
#> 
#> 
#> 
```
