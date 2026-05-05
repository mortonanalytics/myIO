# Diagnose myIO Rendering Errors

Prints guidance on how to find the most recent JavaScript error from a
myIO widget. In Shiny, errors are available as reactive inputs. Outside
Shiny, errors appear in the browser's developer console.

## Usage

``` r
myIO_last_error(outputId = NULL)
```

## Arguments

- outputId:

  optional Shiny output ID (character string). If provided, prints the
  exact Shiny input key to read.

## Value

Invisibly returns `NULL`. Called for its side effect (printing
diagnostic guidance).

## Examples

``` r
myIO_last_error()
#> myIO: To debug rendering issues:
#>   1. Open your browser's developer console (F12)
#>   2. Look for warnings prefixed with [myIO]
#>   3. In Shiny, read: input$`myIO-{outputId}-error`
myIO_last_error("chart1")
#> myIO: Read the last error for 'chart1' with:
#>   input$`myIO-chart1-error`
#> 
#> Outside Shiny, open the browser console (F12) and look for:
#>   [myIO] Layer '...' removed: ...
#>   [myIO] Render error: ...
```
