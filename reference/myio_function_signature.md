# Get a myIO Function Signature for LLM Tool Calling

Get a myIO Function Signature for LLM Tool Calling

## Usage

``` r
myio_function_signature(fn = NULL)
```

## Arguments

- fn:

  Optional exported function name. When `NULL`, returns all signatures.

## Value

A character vector of argument names or a named list of signatures.

## Examples

``` r
myio_function_signature("setAxisFormat")
#> [1] "myIO"    "xAxis"   "yAxis"   "toolTip" "xLabel"  "yLabel" 
```
