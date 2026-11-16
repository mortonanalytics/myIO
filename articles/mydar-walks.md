# Plotting myDAR walks

myDAR maps a site from a phone walk. Each walk produces a point cloud, a
DEM, a GeoPackage with the track, GPS fixes and accuracy figures, and
the device trajectory. myIO reads those files into data frames and plots
them.

## Reading a walk

[`read_mydar_walk()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
reads a walk output directory:

| File | Element | Reader |
|----|----|----|
| `walk.copc.laz` | `points` | [`read_mydar_points()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md) (needs **rlas**) |
| `terrain.tif` | `terrain` | [`read_mydar_terrain()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md) (needs **terra**) |
| `orthophoto.tif` | `orthophoto` | [`read_mydar_orthophoto()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md) (needs **terra**) |
| `walk.gpkg` | `track`, `track_points`, `gps_fixes`, `pins`, `features`, `accuracy` | [`read_mydar_gpkg()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md) (needs **sf**) |
| `trajectory.csv` | `trajectory` | [`read_mydar_trajectory()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md) |

myIO does not install rlas, terra or sf; the readers ask for them when
they need them.

``` r

walk <- read_mydar_walk("path/to/walk", max_points = 20000)
walk
```

The reader keeps `max_points` of the cloud (every k-th point in file
order, which keeps the relative density across the walk; `Inf` keeps
them all) and records the full count. The DEM is aggregated when it has
more than `max_cells` cells. By default every table moves to walk-local
coordinates by subtraction: x and y become meters from the walk’s
south-west corner, z the height above the lowest ground cell
(`walk$origin` holds the shift). The orthophoto comes back as a plain
PNG with its extent in the same coordinates.

The examples below use `mydar_iphone_walk`: a real outdoor walk recorded
with the myDAR iPhone app and processed with the myDAR CLI (autodar
commit `a1388d8`), shown in local coordinates only. Its x and y were
moved to meters from the walk’s south-west corner and its heights to
height above the lowest ground cell, by subtraction only; the subtracted
origin and the project CRS are not included, and the orthophoto ships as
pixels only. Classes, point sigma, GPS residuals and the accuracy
figures are as measured. It keeps 6,000 points for the SVG charts;
[`mydar_iphone_cloud()`](https://mortonanalytics.github.io/myIO/reference/mydar_iphone_cloud.md)
returns 500,000 of the walk’s points for the 3D view. Neither needs the
optional packages. `data-raw/mydar_iphone_walk.R` in the myIO repository
builds both from a walk folder.

``` r

walk <- mydar_iphone_walk
walk
#> <mydar_walk>
#>   points:       6,000 of 887,038
#>   terrain:      9,783 cells
#>   track:        26 vertices
#>   gps_fixes:    49
#>   features:     none
#>   trajectory:   2,984 poses
#>   orthophoto:   352 x 453 px
#>   local coordinates (origin withheld)
```

A profile line across the middle of the track, used below:

``` r

ym <- mean(range(walk$track$y))
line <- list(from = c(0, ym), to = c(22, ym))
```

## The views

### 3D point cloud

The cloud in 3D, the way the myDAR app’s Results screen shows it: drag
to orbit, shift-drag to pan, scroll or pinch to zoom, or switch to 2D
for a top-down plan with a scale bar. The chips color the points by
camera color, class, height or sigma and turn the orthophoto under them
on and off. The card gives the walk’s two accuracy figures, Shape and
Map, separately.

``` r

mydar_cloud_view(walk, points = mydar_iphone_cloud())
```

### Plan view

The orthophoto with the points (by LAS class), the track and the profile
line over it, drawn to scale
([`setEqualAspect()`](https://mortonanalytics.github.io/myIO/reference/setEqualAspect.md)),
with the accuracy figures in the corner.
[`mydar_orthophoto_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
shows the orthophoto alone.

``` r

mydar_plan_view(walk, profile = line)
```

### Terrain

The DEM uses the `raster` chart type: a grid of cells drawn as one
image, colored by height and shaded by a hillshade. Hover a cell for its
height.

``` r

mydar_terrain_view(walk, azimuth = 315, altitude = 45)
```

The raster type works for any regular grid: map `x_var`, `y_var` (cell
centers) and `value`, and optionally `shade` (0-1).

``` r

grid <- expand.grid(x = seq(0, 5, by = 0.1), y = seq(0, 3, by = 0.1))
grid$value <- sin(grid$x) * cos(grid$y)
myIO() |>
  addIoLayer(type = "raster", label = "value", data = grid,
             mapping = list(x_var = "x", y_var = "y", value = "value"),
             options = list(palette = "cividis"))
```

### Profile

Points within a corridor along a line, as height against distance along
the line, with the DEM height along the same line.
[`mydar_profile()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
returns the corridor points as a data frame.

``` r

mydar_profile_view(walk, from = line$from, to = line$to, width = 0.5)
```

``` r

head(mydar_profile(walk, from = line$from, to = line$to))
#>   distance       offset point_id     x      y         z class       class_name
#> 1    2.146 -0.200905845     1247 2.146 13.593 0.3133428     3   Low vegetation
#> 2    2.332  0.018094155     1381 2.332 13.812 0.3803428     0 Never classified
#> 3    2.349  0.009094155     1354 2.349 13.803 0.3683428     3   Low vegetation
#> 4    2.400 -0.178905845     1365 2.400 13.615 0.3873428     3   Low vegetation
#> 5    2.425 -0.159905845     1341 2.425 13.634 0.3713428     3   Low vegetation
#> 6    2.523 -0.182905845     1386 2.523 13.611 0.4223428     3   Low vegetation
#>      sigma_m source  r  g  b
#> 1 0.02614520  LiDAR 65 67 54
#> 2 0.02442709  LiDAR  0  0  0
#> 3 0.02496253  LiDAR 24 35 37
#> 4 0.02444370  LiDAR 32 45 51
#> 5 0.02521276  LiDAR 36 44 46
#> 6 0.02352853  LiDAR 35 49 50
```

### Uncertainty and QA

``` r

mydar_trajectory_view(walk)
mydar_gps_view(walk)
mydar_sigma_view(walk)
mydar_accuracy_view(walk)
```

[`mydar_gps_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
plots each GPS fix’s residual against the fused track, next to the 95%
residual the processing expected. `sigma_m` is the per-point 1-sigma per
axis that the cloud stores, on a log10 axis because camera points (when
a walk has them) run to meters while LiDAR stays near 2-3 cm; this walk
is LiDAR only. The accuracy chart puts the shape figure (how well
distances inside the walk hold) next to map position (where the walk
sits on the map). Here the map position comes from phone GPS, so it is
far larger than the shape figure within 5 m.

## All at once

[`mydar_dashboard()`](https://mortonanalytics.github.io/myIO/reference/mydar_dashboard.md)
lays out the views on one page in the app’s order: the 3D cloud and the
plan view first, then the profile, then the quality charts. Brush the
plan view and the same points light up on the profile; hover the
uncertainty or GPS chart and the other shows a cursor at the same moment
(the GPS chart appears when the walk has GPS residuals).

``` r

mydar_dashboard(walk, points = mydar_iphone_cloud())
```
