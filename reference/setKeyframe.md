# Control Keyframes in Shiny

Select a named or numbered keyframe, or step an existing myIO widget
without re-rendering the widget.

## Usage

``` r
setKeyframe(proxy, frame)

stepKeyframe(proxy, direction = c("next", "previous"))
```

## Arguments

- proxy:

  A `myIO_proxy` object returned by
  [`myIOProxy()`](https://mortonanalytics.github.io/myIO/reference/myIOProxy.md).

- frame:

  A unique keyframe label or positive one-based keyframe index.

- direction:

  Either `"next"` or `"previous"`.

## Value

The proxy, invisibly.

## Examples

``` r
if (FALSE) { # \dontrun{
myIOProxy("chart") |> setKeyframe("Forecast")
myIOProxy("chart") |> stepKeyframe("next")
} # }
```
