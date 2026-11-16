# Read a myDAR walk

Reads the files a myDAR walk produces into plain data frames that the
`mydar_*_view()` functions plot. `read_mydar_walk()` reads a whole
output directory; the other functions read one file each.

## Usage

``` r
read_mydar_walk(dir, max_points = 20000, max_cells = 40000, local = TRUE)

read_mydar_points(path, max_points = 20000)

read_mydar_terrain(path, max_cells = 40000)

read_mydar_orthophoto(path, max_pixels = 4e+06)

read_mydar_gpkg(path)

read_mydar_trajectory(path)
```

## Arguments

- dir:

  Path to a walk output directory.

- max_points:

  Most points to keep from the cloud. Larger clouds are thinned by
  taking every k-th point in file order, which keeps the relative point
  density across the walk. Use `Inf` to keep every point.

- max_cells:

  Most DEM cells to keep. A larger DEM is aggregated by the smallest
  whole factor that brings it under the limit (cell mean).

- local:

  If `TRUE` (default), every spatial table is moved to walk-local
  coordinates by subtraction only: x and y become meters from a
  whole-meter origin at the south-west corner of the walk, and z becomes
  height above the lowest DEM (ground) cell, or above the lowest
  ground-class point when the walk has no DEM. The subtracted origin is
  kept in `$origin` (x, y, z); add it back to recover project
  coordinates. `trajectory.csv` is in its own local frame (meters east,
  north and up of the first GPS fix) and is left as written.

- path:

  Path to one walk file.

- max_pixels:

  Most orthophoto pixels to keep; a larger image is averaged down by the
  smallest whole factor that fits.

## Value

`read_mydar_walk()` returns a `mydar_walk` list with

- points:

  One row per kept point: `point_id` (row in the file), `x`, `y`, `z`,
  `class` (LAS code), `class_name`, `sigma_m` (the file's per-point
  1-sigma, per axis, in meters), `source` (`"LiDAR"` or `"camera"`) and,
  when the cloud is colored, `r`, `g`, `b` (0-255).

- terrain:

  One row per DEM cell with a height: `x`, `y` (cell center) and `z`.
  Attribute `cell_size` holds the cell width and height.

- track:

  Track vertices in walk order: `vertex`, `x`, `y`, `z`.

- track_points:

  Once-a-second track samples with `t_s` and `map_95_m`, the 95%
  map-position radius at that time.

- gps_fixes:

  GPS fixes with `t_s`, `h_acc_m`, `used`, `residual_m`, `residual_95_m`
  and `map_95_m`.

- pins:

  Control pins placed on the walk.

- features:

  Named list, one data frame per feature layer, one row per vertex
  (`fid`, `vertex`, `x`, `y`, `z` and the layer's attributes).

- accuracy:

  The one-row `accuracy` table.

- orthophoto:

  From `orthophoto.tif`: `png`, the image as PNG bytes with no
  georeference or metadata, and `extent`, `c(xmin, xmax, ymin, ymax)` in
  the walk's coordinates.

- trajectory:

  Poses from `trajectory.csv` with `t_s` (seconds from the first pose).

- crs:

  The project CRS, e.g. `"EPSG:32612"`.

- origin:

  The x/y/z origin subtracted when `local = TRUE`, else
  `c(x = 0, y = 0, z = 0)`.

The single-file readers return the matching element.

## Details

A walk directory holds `walk.copc.laz` (the point cloud), `terrain.tif`
(the DEM), `orthophoto.tif`, `walk.gpkg` (track, GPS fixes, pins,
features and the `accuracy` table) and `trajectory.csv` (the device
poses). Walks recorded without LiDAR have no point cloud or DEM; those
parts of the result are `NULL`.

The readers need packages that myIO does not install: rlas for the point
cloud, terra for the DEM and orthophoto and sf for the GeoPackage.

## See also

[`mydar_dashboard`](https://mortonanalytics.github.io/myIO/reference/mydar_dashboard.md)
and the other `mydar_*_view()` functions;
[`mydar_iphone_walk`](https://mortonanalytics.github.io/myIO/reference/mydar_iphone_walk.md)
for a walk that needs none of the optional packages.

## Examples

``` r
if (FALSE) { # \dontrun{
walk <- read_mydar_walk("path/to/walk", max_points = 20000)
walk
mydar_dashboard(walk)
} # }
```
