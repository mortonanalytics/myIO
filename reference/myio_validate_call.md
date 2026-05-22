# Validate a myIO Function Call

Validate a myIO Function Call

## Usage

``` r
myio_validate_call(fn, args = list())
```

## Arguments

- fn:

  Exported myIO function name.

- args:

  Named list of proposed arguments.

## Value

A list with `valid` and `errors`. Errors use stable machine-readable
`code` values.

## Examples

``` r
myio_validate_call("setAxisFormat", list(axis_x = ".0f"))
#> $valid
#> [1] FALSE
#> 
#> $errors
#> $errors[[1]]
#> $errors[[1]]$code
#> [1] "UNKNOWN_ARGUMENT"
#> 
#> $errors[[1]]$field
#> [1] "axis_x"
#> 
#> $errors[[1]]$message
#> [1] "Unknown argument 'axis_x' for function 'setAxisFormat'."
#> 
#> $errors[[1]]$suggestion
#> [1] "xAxis"
#> 
#> 
#> 
```
