# The bundled myDAR walk's point cloud

500,000 of the 887,038 points of
[`mydar_iphone_walk`](https://mortonanalytics.github.io/myIO/reference/mydar_iphone_walk.md),
in the same local coordinates, for the 3D view
([`mydar_cloud_view`](https://mortonanalytics.github.io/myIO/reference/mydar_cloud_view.md)).
The points ship as a compressed binary file in `inst/extdata`, with x, y
and z stored to a fraction of a millimeter, colors as 8-bit RGB, and
sigma to about 4% of its value.

## Usage

``` r
mydar_iphone_cloud()
```

## Value

A data frame with `x`, `y`, `z`, `class`, `class_name`, `sigma_m`,
`source`, `r`, `g` and `b`, one row per point.

## See also

[`read_mydar_points`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
reads every point of a walk on disk.

## Examples

``` r
cloud <- mydar_iphone_cloud()
nrow(cloud)
#> [1] 500000
table(cloud$class_name)
#> 
#>          Building            Ground   High vegetation    Low vegetation 
#>             34712              9784                 1            378597 
#> Medium vegetation  Never classified              Road      Unclassified 
#>              5937             12362              8732             49875 
```
