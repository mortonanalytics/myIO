# Get myIO Chart Schema for LLM Tool Calling

Get myIO Chart Schema for LLM Tool Calling

## Usage

``` r
myio_chart_schema(type = NULL)
```

## Arguments

- type:

  Optional chart type. When `NULL`, returns every type schema.

## Value

A list containing one chart schema or all chart schemas.

## Examples

``` r
myio_chart_schema("boxplot")
#> $kind
#> [1] "composite"
#> 
#> $renderer_type
#> [1] FALSE
#> 
#> $required_mappings
#> $required_mappings[[1]]
#> [1] "x_var"
#> 
#> $required_mappings[[2]]
#> [1] "y_var"
#> 
#> 
#> $numeric_fields
#> [1] "y_var"
#> 
#> $valid_transforms
#> [1] "identity"
#> 
#> $group
#> [1] "axes-categorical"
#> 
#> $data_contract
#> NULL
#> 
#> $scale_hints
#> NULL
#> 
```
