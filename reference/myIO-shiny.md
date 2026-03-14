# Shiny bindings for myIO

Shiny bindings for myIO

## Usage

``` r
myIOOutput(outputId, width = "100%", height = "400px")

renderMyIO(expr, env = parent.frame(), quoted = FALSE)
```

## Arguments

- outputId:

  output variable to read from

- width, height:

  Must be a valid CSS unit or a number.

- expr:

  An expression that generates a myIO

- env:

  The environment in which to evaluate `expr`.

- quoted:

  Is `expr` a quoted expression?
