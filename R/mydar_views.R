#' Plot a myDAR walk
#'
#' Each function turns one part of a \code{mydar_walk} (from
#' \code{\link{read_mydar_walk}} or \code{\link{mydar_iphone_walk}}) into a
#' myIO chart.
#'
#' \describe{
#'   \item{\code{mydar_plan_view()}}{The walk from above: the orthophoto,
#'     points colored by LAS class, the track, point features and, when
#'     \code{profile} is given, the profile line, drawn to scale (equal
#'     meters per pixel on both axes) with the walk's Shape and Map accuracy
#'     as a caption.}
#'   \item{\code{mydar_orthophoto_view()}}{The orthophoto alone, to scale,
#'     with the track.}
#'   \item{\code{mydar_terrain_view()}}{The DEM as a \code{"raster"} layer,
#'     colored by height and, by default, shaded by a hillshade, to scale.}
#'   \item{\code{mydar_profile_view()}}{Points within \code{width} of the line
#'     from \code{from} to \code{to}, plotted as height against distance along
#'     the line, with the DEM height along the same line.}
#'   \item{\code{mydar_trajectory_view()}}{The 95\% map-position radius along
#'     the walk over time, with each GPS fix's reported horizontal accuracy.}
#'   \item{\code{mydar_sigma_view()}}{The distribution of per-point
#'     \code{sigma_m} (1-sigma per axis) for LiDAR and camera points, on a
#'     log10 axis because camera sigma can be a hundred times LiDAR's.}
#'   \item{\code{mydar_accuracy_view()}}{The accuracy table's 95\% figures:
#'     shape (how well distances within the walk hold, by range band) against
#'     map position (where the walk sits on the map), and held-out pin misses
#'     when the walk used pins.}
#'   \item{\code{mydar_gps_view()}}{Each GPS fix's residual against the fused
#'     track, with the 95\% residual the processing expected.}
#' }
#'
#' @param walk A \code{mydar_walk}.
#' @param profile Optional \code{list(from = c(x, y), to = c(x, y))}; draws the
#'   profile line on the plan view.
#' @param points If \code{TRUE} (default), draw the points (by class) over the
#'   orthophoto.
#' @param from,to Profile line ends, each \code{c(x, y)} in the walk's
#'   coordinates. When both are \code{NULL}, the line crosses the track at its
#'   midpoint and spans the point cloud.
#' @param width Corridor width in meters; points within \code{width / 2} of
#'   the line are kept.
#' @param hillshade If \code{TRUE} (default), shade the DEM by a hillshade lit
#'   from \code{azimuth} (degrees clockwise from north) and \code{altitude}
#'   (degrees above the horizon).
#' @param azimuth,altitude Hillshade light direction.
#' @param height Widget height, a CSS size.
#'
#' @return A \code{myIO} widget. \code{mydar_profile()} returns the corridor
#'   points as a data frame with \code{distance} (meters along the line),
#'   \code{offset} (meters left of the line, negative to the right), and the
#'   point columns.
#'
#' @seealso \code{\link{mydar_dashboard}} lays out all of these at once.
#' @examples
#' walk <- mydar_iphone_walk
#' mydar_plan_view(walk)
#' mydar_orthophoto_view(walk)
#' mydar_terrain_view(walk)
#' mydar_profile_view(walk)
#' mydar_trajectory_view(walk)
#' mydar_sigma_view(walk)
#' mydar_accuracy_view(walk)
#' head(mydar_profile(walk))
#'
#' # mydar_gps_view() needs GPS fixes with residuals; this walk has none.
#' if (any(is.finite(walk$gps_fixes$residual_m))) mydar_gps_view(walk)
#' @name mydar_views
NULL

#' @rdname mydar_views
#' @export
mydar_plan_view <- function(walk, profile = NULL, points = TRUE, height = "460px") {
  pts <- mydar_need(walk, "points", "mydar_plan_view")
  check_flag(points, "points", "mydar_plan_view")
  pts <- pts[order(pts$class), , drop = FALSE]

  w <- myIO(title = "Plan view", height = height)
  w <- mydar_add_orthophoto(w, walk)
  if (points) {
    w <- addIoLayer(w, type = "point", label = "points", data = pts, color = mydar_class_colors(pts$class),
                    mapping = list(x_var = "x", y_var = "y", group = "class_name"),
                    options = list(pointRadius = 1.6, opacity = if (is.null(walk$orthophoto)) 1 else 0.7))
  }

  if (!is.null(walk$track) && nrow(walk$track) > 1L) {
    w <- addIoLayer(w, type = "line", label = "Track", data = walk$track, color = "#1d2430",
                    mapping = list(x_var = "x", y_var = "y"),
                    options = list(curveType = "linear", showPoints = FALSE))
  }

  feature_rows <- mydar_feature_points(walk)
  if (!is.null(feature_rows)) {
    w <- addIoLayer(w, type = "point", label = "Features", data = feature_rows, color = "#CC79A7",
                    mapping = list(x_var = "x", y_var = "y"))
  }

  if (!is.null(profile)) {
    line <- mydar_check_line(profile$from, profile$to, "mydar_plan_view")
    w <- addIoLayer(w, type = "line", label = "Profile line", color = "#0072B2",
                    data = data.frame(x = c(line$from[1], line$to[1]), y = c(line$from[2], line$to[2])),
                    mapping = list(x_var = "x", y_var = "y"),
                    options = list(curveType = "linear", showPoints = FALSE))
  }

  mydar_add_caption(w, walk) |>
    setEqualAspect() |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f",
                  xLabel = mydar_axis_label(walk, "x"), yLabel = mydar_axis_label(walk, "y"))
}

#' @rdname mydar_views
#' @export
mydar_orthophoto_view <- function(walk, height = "460px") {
  if (!inherits(walk, "mydar_walk")) {
    stop("mydar_orthophoto_view(): `walk` must be a mydar_walk from read_mydar_walk().", call. = FALSE)
  }
  if (is.null(walk$orthophoto)) {
    stop("mydar_orthophoto_view(): this walk has no orthophoto.", call. = FALSE)
  }
  w <- mydar_add_orthophoto(myIO(title = "Orthophoto", height = height), walk)
  if (!is.null(walk$track) && nrow(walk$track) > 1L) {
    w <- addIoLayer(w, type = "line", label = "Track", data = walk$track, color = "#1d2430",
                    mapping = list(x_var = "x", y_var = "y"),
                    options = list(curveType = "linear", showPoints = FALSE))
  }
  mydar_add_caption(w, walk) |>
    setEqualAspect() |>
    suppressLegend() |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f",
                  xLabel = mydar_axis_label(walk, "x"), yLabel = mydar_axis_label(walk, "y"))
}

#' @rdname mydar_views
#' @export
mydar_terrain_view <- function(walk, hillshade = TRUE, azimuth = 315, altitude = 45, height = "420px") {
  terrain <- mydar_need(walk, "terrain", "mydar_terrain_view")
  check_flag(hillshade, "hillshade", "mydar_terrain_view")
  cell <- attr(terrain, "cell_size")
  mapping <- list(x_var = "x", y_var = "y", value = "z")
  if (hillshade) {
    terrain$shade <- mydar_hillshade(terrain, azimuth, altitude)
    mapping$shade <- "shade"
  }
  options <- if (length(cell) == 2L) list(cellWidth = cell[1], cellHeight = cell[2]) else list()

  myIO(title = if (hillshade) "Terrain (DEM, hillshaded)" else "Terrain (DEM)", height = height) |>
    addIoLayer(type = "raster", label = "Height", data = terrain, mapping = mapping, options = options) |>
    setEqualAspect() |>
    setAxisFormat(xAxis = ".0f", yAxis = ".0f",
                  xLabel = mydar_axis_label(walk, "x"), yLabel = mydar_axis_label(walk, "y"))
}

#' @rdname mydar_views
#' @export
mydar_profile <- function(walk, from = NULL, to = NULL, width = 0.5) {
  pts <- mydar_need(walk, "points", "mydar_profile")
  if (!is.numeric(width) || length(width) != 1L || !is.finite(width) || width <= 0) {
    stop("mydar_profile(): `width` must be a single positive number of meters.", call. = FALSE)
  }
  line <- if (is.null(from) && is.null(to)) mydar_default_profile(walk) else mydar_check_line(from, to, "mydar_profile")
  geom <- mydar_line_frame(line, pts$x, pts$y)
  keep <- geom$along >= 0 & geom$along <= geom$length & abs(geom$offset) <= width / 2
  out <- cbind(data.frame(distance = geom$along[keep], offset = geom$offset[keep]), pts[keep, , drop = FALSE])
  out <- out[order(out$distance), , drop = FALSE]
  rownames(out) <- NULL
  attr(out, "line") <- line
  out
}

#' @rdname mydar_views
#' @export
mydar_profile_view <- function(walk, from = NULL, to = NULL, width = 0.5, height = "360px") {
  prof <- mydar_profile(walk, from = from, to = to, width = width)
  if (nrow(prof) == 0L) {
    stop("mydar_profile_view(): no points within ", width / 2, " m of the profile line.", call. = FALSE)
  }
  line <- attr(prof, "line")
  prof <- prof[order(prof$class), , drop = FALSE]

  w <- myIO(title = sprintf("Profile (%.1f m corridor)", width), height = height) |>
    addIoLayer(type = "point", label = "points", data = prof, color = mydar_class_colors(prof$class),
               mapping = list(x_var = "distance", y_var = "z", group = "class_name"))

  dem <- mydar_terrain_profile(walk$terrain, line)
  if (!is.null(dem) && nrow(dem) > 1L) {
    w <- addIoLayer(w, type = "line", label = "DEM", data = dem, color = "#111827",
                    mapping = list(x_var = "distance", y_var = "z"),
                    options = list(curveType = "linear", showPoints = FALSE))
  }

  setAxisFormat(w, xAxis = ".1f", yAxis = ".2f", xLabel = "Distance along line (m)",
                yLabel = if (mydar_is_local(walk, "z")) "Height above lowest ground (m)" else "Height (m)")
}

#' @rdname mydar_views
#' @export
mydar_trajectory_view <- function(walk, height = "320px") {
  tp <- mydar_need(walk, "track_points", "mydar_trajectory_view")
  tp <- tp[is.finite(tp$t_s) & is.finite(tp$map_95_m), , drop = FALSE]
  tp <- tp[order(tp$t_s), , drop = FALSE]

  w <- myIO(title = "Map position uncertainty along the walk", height = height) |>
    addIoLayer(type = "line", label = "Map position 95%", data = tp, color = "#0072B2",
               mapping = list(x_var = "t_s", y_var = "map_95_m"))

  gps <- walk$gps_fixes
  if (!is.null(gps)) {
    gps <- gps[is.finite(gps$t_s) & is.finite(gps$h_acc_m), , drop = FALSE]
    if (nrow(gps) > 0L) {
      w <- addIoLayer(w, type = "point", label = "GPS horizontal accuracy", data = gps, color = "#E69F00",
                      mapping = list(x_var = "t_s", y_var = "h_acc_m"))
    }
  }
  setAxisFormat(w, xAxis = ".1f", yAxis = ".1f", xLabel = "Time since start (s)", yLabel = "Meters")
}

#' @rdname mydar_views
#' @export
mydar_sigma_view <- function(walk, height = "320px") {
  pts <- mydar_need(walk, "points", "mydar_sigma_view")
  pts <- pts[is.finite(pts$sigma_m) & pts$sigma_m > 0, c("source", "sigma_m"), drop = FALSE]
  pts$source <- factor(pts$source, levels = intersect(c("LiDAR", "camera"), unique(pts$source)))
  pts <- pts[order(pts$source), , drop = FALSE]
  pts$source <- as.character(pts$source)
  # Camera sigma runs to meters while LiDAR's is centimeters; a log10 axis
  # keeps both distributions readable.
  pts$log10_sigma_m <- log10(pts$sigma_m)

  myIO(title = "Point sigma by source", height = height) |>
    addIoLayer(type = "violin", label = "log10 sigma_m", color = "#009E73", data = pts,
               mapping = list(x_var = "source", y_var = "log10_sigma_m"),
               options = list(showBox = TRUE, showMedian = TRUE)) |>
    setAxisFormat(yAxis = ".1f", xLabel = "Source",
                  yLabel = "log10 sigma_m (-2 = 1 cm, 0 = 1 m)")
}

#' @rdname mydar_views
#' @export
mydar_accuracy_view <- function(walk, height = "320px") {
  figures <- mydar_accuracy_figures(walk)
  if (nrow(figures) == 0L) {
    stop("mydar_accuracy_view(): the walk's accuracy table has no 95% figures.", call. = FALSE)
  }
  myIO(title = "Accuracy figures (95%)", height = height) |>
    addIoLayer(type = "lollipop", label = "95% (m)", color = "#0072B2", data = figures,
               mapping = list(x_var = "figure", y_var = "value_m")) |>
    defineCategoricalAxis(xAxis = TRUE) |>
    setAxisFormat(yAxis = ".2f", xLabel = "", yLabel = "Meters")
}

#' @rdname mydar_views
#' @export
mydar_gps_view <- function(walk, height = "320px") {
  gps <- mydar_need(walk, "gps_fixes", "mydar_gps_view")
  gps <- gps[is.finite(gps$t_s) & is.finite(gps$residual_m), , drop = FALSE]
  if (nrow(gps) == 0L) {
    stop("mydar_gps_view(): no GPS fix has a residual.", call. = FALSE)
  }
  gps <- gps[order(gps$t_s), , drop = FALSE]
  gps$status <- ifelse(gps$used == 1, "Used", "Ignored")

  w <- myIO(title = "GPS residuals", height = height) |>
    addIoLayer(type = "point", label = "residuals", data = gps,
               color = unname(c(Used = "#0072B2", Ignored = "#D55E00")[unique(gps$status)]),
               mapping = list(x_var = "t_s", y_var = "residual_m", group = "status"))
  bound <- gps[is.finite(gps$residual_95_m), , drop = FALSE]
  if (nrow(bound) > 1L) {
    w <- addIoLayer(w, type = "line", label = "Expected 95%", data = bound, color = "#6B7280",
                    mapping = list(x_var = "t_s", y_var = "residual_95_m"))
  }
  setAxisFormat(w, xAxis = ".1f", yAxis = ".2f", xLabel = "Time since start (s)", yLabel = "Residual (m)")
}

#' 3D view of a myDAR walk's point cloud
#'
#' Draws the cloud with WebGL (the \code{"pointcloud"} chart type): orbit,
#' pan and zoom in 3D, or switch to a top-down 2D plan. Points can be colored
#' by their camera color, class, height or sigma, with the orthophoto under
#' them and the track over them. The walk's Shape and Map accuracy figures sit
#' in a card on the view.
#'
#' Controls: drag to rotate (2D: pan), shift-drag or right-drag to pan, scroll
#' or pinch to zoom, double-click to reset.
#'
#' @param walk A \code{mydar_walk}; its orthophoto, track and accuracy figures
#'   are drawn with the cloud.
#' @param points The points to draw. Defaults to \code{walk$points}; pass
#'   \code{\link{mydar_iphone_cloud}()} or \code{\link{read_mydar_points}(path,
#'   max_points = Inf)} for a denser cloud. Needs \code{x}, \code{y},
#'   \code{z}; uses \code{r}/\code{g}/\code{b}, \code{class} and
#'   \code{sigma_m} when present.
#' @param color Starting color: \code{"rgb"} (camera color), \code{"class"},
#'   \code{"height"} or \code{"sigma"}. The view's chips switch it.
#' @param mode Starting view: \code{"3d"} or \code{"plan"}.
#' @param point_size Smallest point size in pixels; points also grow to
#'   cover about 2.5 cm on the ground so surfaces close up.
#' @param ortho Draw the orthophoto under the points when the walk has one.
#' @param height Widget height, a CSS size.
#' @return A \code{myIO} widget.
#' @examples
#' mydar_cloud_view(mydar_iphone_walk)
#' \donttest{
#' mydar_cloud_view(mydar_iphone_walk, points = mydar_iphone_cloud(), color = "class")
#' }
#' @export
mydar_cloud_view <- function(walk, points = NULL, color = c("rgb", "class", "height", "sigma"),
                             mode = c("3d", "plan"), point_size = 2, ortho = TRUE, height = "560px") {
  if (!inherits(walk, "mydar_walk")) {
    stop("mydar_cloud_view(): `walk` must be a mydar_walk from read_mydar_walk().", call. = FALSE)
  }
  pts <- if (is.null(points)) mydar_need(walk, "points", "mydar_cloud_view") else points
  if (!is.data.frame(pts) || !all(c("x", "y", "z") %in% names(pts)) || nrow(pts) == 0L) {
    stop("mydar_cloud_view(): `points` must be a data frame with x, y and z.", call. = FALSE)
  }
  color <- match.arg(color)
  mode <- match.arg(mode)
  check_flag(ortho, "ortho", "mydar_cloud_view")
  if (!is.numeric(point_size) || length(point_size) != 1L || !is.finite(point_size) || point_size <= 0) {
    stop("mydar_cloud_view(): `point_size` must be a single positive number.", call. = FALSE)
  }

  mapping <- list(x_var = "x", y_var = "y", z_var = "z")
  if (all(c("r", "g", "b") %in% names(pts))) mapping <- c(mapping, list(red = "r", green = "g", blue = "b"))
  if ("class" %in% names(pts)) mapping$class <- "class"
  if ("sigma_m" %in% names(pts)) mapping$sigma <- "sigma_m"
  if (color == "rgb" && is.null(mapping$red)) color <- "class"

  present <- MYDAR_CLASSES[MYDAR_CLASSES$class %in% unique(pts$class), , drop = FALSE]
  options <- list(
    color = color, mode = if (mode == "plan") "plan" else "3d", pointSize = point_size,
    classColors = as.list(stats::setNames(present$color, present$class)),
    classNames = as.list(stats::setNames(present$class_name, present$class)),
    caption = mydar_caption(walk)
  )
  if (!is.null(walk$track) && nrow(walk$track) > 1L) {
    tr <- walk$track[is.finite(walk$track$x) & is.finite(walk$track$z), , drop = FALSE]
    options$track <- lapply(seq_len(nrow(tr)), function(i) c(tr$x[i], tr$y[i], tr$z[i]))
  }
  if (ortho && !is.null(walk$orthophoto)) {
    ground <- if (!is.null(walk$terrain)) min(walk$terrain$z, na.rm = TRUE) else min(pts$z, na.rm = TRUE)
    e <- walk$orthophoto$extent
    options$ortho <- list(
      src = paste0("data:image/png;base64,", jsonlite::base64_enc(walk$orthophoto$png)),
      extent = unname(c(e[["xmin"]], e[["xmax"]], e[["ymin"]], e[["ymax"]])),
      z = ground - 0.02
    )
  }

  myIO(height = height) |>
    addIoLayer(type = "pointcloud", label = "Point cloud", data = pts, mapping = mapping, options = options) |>
    setMargin(top = 0, bottom = 0, left = 0, right = 0) |>
    suppressAxis(xAxis = TRUE, yAxis = TRUE) |>
    suppressLegend()
}

#' myDAR walk dashboard
#'
#' Lays out a walk the way the myDAR app's Results screen does: the 3D point
#' cloud and the plan view over the orthophoto first, both captioned with the
#' walk's Shape and Map accuracy, then the profile, then the quality charts
#' (map-position uncertainty, GPS residuals, point sigma, accuracy figures).
#' Brushing points on the plan view highlights the same points on the profile.
#' When the walk has GPS residuals, the GPS chart shares a time cursor with the
#' uncertainty chart.
#'
#' @inheritParams mydar_views
#' @inheritParams mydar_cloud_view
#' @param profile Optional \code{list(from = c(x, y), to = c(x, y))} for the
#'   profile line. Default: across the track at its midpoint.
#'
#' @return A browsable \code{htmltools} tag list. Print it, return it from a
#'   Shiny \code{renderUI()}, or save it with \code{htmltools::save_html()}.
#' @examples
#' if (requireNamespace("htmltools", quietly = TRUE)) {
#'   mydar_dashboard(mydar_iphone_walk)
#' }
#' @export
mydar_dashboard <- function(walk, points = NULL, profile = NULL, width = 0.5) {
  mydar_require("htmltools", "mydar_dashboard")
  if (is.null(profile)) profile <- mydar_default_profile(walk)
  line <- mydar_check_line(profile$from, profile$to, "mydar_dashboard")

  linked_space <- linkCharts(
    mydar_plan_view(walk, profile = line, height = "520px") |> setBrush(),
    mydar_profile_view(walk, from = line$from, to = line$to, width = width),
    on = "point_id", group = paste0("mydar_points_", new_chart_id())
  )
  gps <- walk$gps_fixes
  has_gps <- !is.null(gps) && "residual_m" %in% names(gps) && any(is.finite(gps$residual_m))
  time_charts <- if (has_gps) {
    linkCharts(mydar_trajectory_view(walk), mydar_gps_view(walk),
               on = "t_s", group = paste0("mydar_time_", new_chart_id()), cursor = TRUE)
  } else {
    list(mydar_trajectory_view(walk))
  }

  cell <- function(widget, wide = FALSE) {
    htmltools::tags$div(class = if (wide) "mydar-cell mydar-wide" else "mydar-cell", widget)
  }
  heading <- function(text) htmltools::tags$h3(class = "mydar-heading", text)
  quality <- list(
    cell(time_charts[[1]]),
    if (has_gps) cell(time_charts[[2]]),
    cell(mydar_sigma_view(walk)),
    cell(mydar_accuracy_view(walk))
  )
  if (!is.null(walk$terrain)) quality <- c(quality, list(cell(mydar_terrain_view(walk))))

  htmltools::browsable(htmltools::tagList(
    htmltools::tags$style(htmltools::HTML(paste(
      ".mydar-dashboard { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }",
      ".mydar-cell { min-width: 0; }",
      ".mydar-wide { grid-column: 1 / -1; }",
      ".mydar-heading { grid-column: 1 / -1; margin: 12px 0 0; font: 600 18px/1.3 system-ui, sans-serif; color: #1d2430; }",
      "@media (max-width: 800px) { .mydar-dashboard { grid-template-columns: minmax(0, 1fr); } }"
    ))),
    htmltools::tags$div(
      class = "mydar-dashboard",
      heading("Map"),
      cell(mydar_cloud_view(walk, points = points, height = "520px")),
      cell(linked_space[[1]]),
      heading("Profile"),
      cell(linked_space[[2]], wide = TRUE),
      heading("Quality"),
      quality
    )
  ))
}

# -- helpers -----------------------------------------------------------------

mydar_need <- function(walk, part, caller) {
  if (!inherits(walk, "mydar_walk")) {
    stop(caller, "(): `walk` must be a mydar_walk from read_mydar_walk().", call. = FALSE)
  }
  df <- walk[[part]]
  if (is.null(df) || nrow(df) == 0L) {
    stop(caller, "(): this walk has no ", part, ".", call. = FALSE)
  }
  df
}

mydar_class_colors <- function(class_codes) {
  present <- sort(unique(class_codes))
  colors <- MYDAR_CLASSES$color[match(present, MYDAR_CLASSES$class)]
  colors[is.na(colors)] <- "#999999"
  colors
}

mydar_axis_label <- function(walk, axis) {
  name <- if (axis == "x") "Easting" else "Northing"
  if (mydar_is_local(walk, axis)) paste(name, "from walk origin (m)") else paste(name, "(m)")
}

# TRUE when the walk's coordinates on this axis were moved to a local origin
# (a known shift, or one withheld as NA).
mydar_is_local <- function(walk, axis) {
  o <- walk$origin[axis]
  length(o) == 1L && !is.null(names(o)) && !is.na(names(o)) && (is.na(o) || o != 0)
}

mydar_feature_points <- function(walk) {
  rows <- lapply(names(walk$features), function(name) {
    df <- walk$features[[name]]
    df <- df[is.finite(df$x) & is.finite(df$y), , drop = FALSE]
    if (nrow(df) == 0L) return(NULL)
    data.frame(layer = name, x = df$x, y = df$y, stringsAsFactors = FALSE)
  })
  rows <- do.call(rbind, rows)
  if (is.null(rows) || nrow(rows) == 0L) NULL else rows
}

mydar_check_line <- function(from, to, caller) {
  ok <- function(p) is.numeric(p) && length(p) == 2L && all(is.finite(p))
  if (!ok(from) || !ok(to)) {
    stop(caller, "(): profile `from` and `to` must each be c(x, y).", call. = FALSE)
  }
  if (isTRUE(all.equal(as.numeric(from), as.numeric(to)))) {
    stop(caller, "(): profile `from` and `to` are the same point.", call. = FALSE)
  }
  list(from = as.numeric(from), to = as.numeric(to))
}

mydar_line_frame <- function(line, x, y) {
  d <- line$to - line$from
  len <- sqrt(sum(d^2))
  u <- d / len
  rx <- x - line$from[1]
  ry <- y - line$from[2]
  list(along = rx * u[1] + ry * u[2], offset = -rx * u[2] + ry * u[1], length = len)
}

# Across the track at its midpoint, long enough to span the cloud.
mydar_default_profile <- function(walk) {
  pts <- mydar_need(walk, "points", "mydar_default_profile")
  track <- walk$track
  if (!is.null(track) && nrow(track) > 1L && all(is.finite(c(track$x, track$y)))) {
    a <- c(track$x[1], track$y[1])
    b <- c(track$x[nrow(track)], track$y[nrow(track)])
  } else {
    a <- c(min(pts$x), mean(range(pts$y)))
    b <- c(max(pts$x), mean(range(pts$y)))
  }
  if (isTRUE(all.equal(a, b))) b <- a + c(0, 1)
  mid <- (a + b) / 2
  dir <- (b - a) / sqrt(sum((b - a)^2))
  perp <- c(dir[2], -dir[1])
  reach <- max(abs((pts$x - mid[1]) * perp[1] + (pts$y - mid[2]) * perp[2]))
  list(from = mid - perp * reach, to = mid + perp * reach)
}

# DEM height along the line at one-cell steps (nearest cell).
mydar_terrain_profile <- function(terrain, line) {
  if (is.null(terrain) || nrow(terrain) == 0L) return(NULL)
  cell <- attr(terrain, "cell_size")
  if (length(cell) != 2L) cell <- rep(min(diff(sort(unique(terrain$x)))), 2)
  x0 <- min(terrain$x)
  y0 <- min(terrain$y)
  key <- function(x, y) round((x - x0) / cell[1]) * 1e6 + round((y - y0) / cell[2])
  lookup <- stats::setNames(terrain$z, key(terrain$x, terrain$y))
  len <- sqrt(sum((line$to - line$from)^2))
  d <- seq(0, len, by = min(cell))
  u <- (line$to - line$from) / len
  z <- unname(lookup[as.character(key(line$from[1] + d * u[1], line$from[2] + d * u[2]))])
  out <- data.frame(distance = d, z = z)
  out[is.finite(out$z), , drop = FALSE]
}

# Lambert hillshade (0-1) from central differences on the cell grid; edge and
# missing neighbors count as level.
mydar_hillshade <- function(terrain, azimuth = 315, altitude = 45) {
  for (v in list(azimuth, altitude)) {
    if (!is.numeric(v) || length(v) != 1L || !is.finite(v)) {
      stop("mydar_terrain_view(): `azimuth` and `altitude` must be single numbers of degrees.", call. = FALSE)
    }
  }
  cell <- attr(terrain, "cell_size")
  if (length(cell) != 2L) {
    cell <- c(min(diff(sort(unique(terrain$x)))), min(diff(sort(unique(terrain$y)))))
  }
  col <- round((terrain$x - min(terrain$x)) / cell[1]) + 1
  row <- round((terrain$y - min(terrain$y)) / cell[2]) + 1
  z <- matrix(NA_real_, max(row), max(col))
  z[cbind(row, col)] <- terrain$z
  pad <- matrix(NA_real_, nrow(z) + 2, ncol(z) + 2)
  pad[2:(nrow(z) + 1), 2:(ncol(z) + 1)] <- z
  at <- function(dr, dc) {
    v <- pad[cbind(row + 1 + dr, col + 1 + dc)]
    ifelse(is.na(v), terrain$z, v)
  }
  dzdx <- (at(0, 1) - at(0, -1)) / (2 * cell[1])
  dzdy <- (at(1, 0) - at(-1, 0)) / (2 * cell[2])
  az <- azimuth * pi / 180
  alt <- altitude * pi / 180
  sun <- c(sin(az) * cos(alt), cos(az) * cos(alt), sin(alt))
  norm <- sqrt(dzdx^2 + dzdy^2 + 1)
  pmax(0, (-dzdx * sun[1] - dzdy * sun[2] + sun[3]) / norm)
}

mydar_accuracy_figures <- function(walk) {
  acc <- walk$accuracy
  spec <- data.frame(
    column = c("shape_95_within_5m_m", "shape_95_5_to_10m_m", "shape_95_10_to_15m_m",
               "shape_95_5_to_15m_m", "map_95_m", "map_95_max_m",
               "loo_stated_95_m", "loo_worst_miss_m"),
    figure = c("Shape <5 m", "Shape 5-10 m", "Shape 10-15 m", "Shape 5-15 m",
               "Map median", "Map max", "Pins stated", "Pins worst miss"),
    kind = c(rep("shape", 4), rep("map position", 2), rep("pins", 2)),
    stringsAsFactors = FALSE
  )
  if (is.null(acc) || nrow(acc) == 0L) {
    return(data.frame(figure = character(0), kind = character(0), value_m = numeric(0)))
  }
  spec <- spec[spec$column %in% names(acc), , drop = FALSE]
  spec$value_m <- vapply(spec$column, function(col) suppressWarnings(as.numeric(acc[[col]][1])), numeric(1))
  out <- spec[is.finite(spec$value_m), c("figure", "kind", "value_m"), drop = FALSE]
  rownames(out) <- NULL
  out
}

# The orthophoto as an "image" layer spanning its extent.
mydar_add_orthophoto <- function(w, walk) {
  o <- walk$orthophoto
  if (is.null(o)) return(w)
  e <- o$extent
  addIoLayer(w, type = "image", label = "Orthophoto",
             data = data.frame(x = c(e[["xmin"]], e[["xmax"]]), y = c(e[["ymin"]], e[["ymax"]])),
             mapping = list(x_var = "x", y_var = "y"),
             options = list(src = paste0("data:image/png;base64,", jsonlite::base64_enc(o$png))))
}

# The walk's two accuracy figures, the way the myDAR app states them: Shape in
# centimeters, Map position in meters, never merged into one number.
mydar_caption <- function(walk) {
  acc <- walk$accuracy
  num <- function(col) if (!is.null(acc) && col %in% names(acc)) suppressWarnings(as.numeric(acc[[col]][1])) else NA_real_
  cm <- function(m) {
    v <- m * 100
    paste0("\u00b1", if (v < 10) formatC(v, format = "f", digits = 1) else formatC(round(v), format = "d"), " cm")
  }
  meters <- function(m) paste0("\u00b1", if (m < 10) formatC(m, format = "f", digits = 1) else formatC(round(m), format = "d"), " m")
  out <- list()
  shape <- num("shape_95_within_5m_m")
  if (is.finite(shape)) {
    out$shape <- cm(shape)
    note <- "within 5 m"
    far <- num("shape_95_5_to_15m_m")
    withheld <- c(num("shape_95_5_to_10m_withheld_m"), num("shape_95_10_to_15m_withheld_m"))
    if (is.finite(far)) {
      note <- paste0(note, " \u00b7 ", cm(far), " at 5\u201315 m")
    } else if (any(is.finite(withheld))) {
      note <- paste0(note, " \u00b7 5\u201315 m withheld")
    }
    out$shapeNote <- note
  }
  map <- num("map_95_m")
  if (is.finite(map)) {
    pins <- num("pins_used")
    out$map <- if (is.finite(pins) && pins > 0 && map < 1) cm(map) else meters(map)
    basis <- if (!is.null(acc) && "map_basis" %in% names(acc)) as.character(acc$map_basis[1]) else NA_character_
    out$mapNote <- if (is.finite(pins) && pins > 0) paste0(basis, ", ", pins, if (pins == 1) " pin" else " pins") else basis
    if (is.na(out$mapNote)) out$mapNote <- NULL
  }
  out
}

# Caption text in the plot's top-left corner: "Shape ±N cm" and "Map ±N m".
mydar_add_caption <- function(w, walk) {
  cap <- mydar_caption(walk)
  lines <- c(if (!is.null(cap$shape)) paste("Shape", cap$shape), if (!is.null(cap$map)) paste("Map", cap$map))
  if (length(lines) == 0L) return(w)
  addIoLayer(w, type = "text", label = "Accuracy", data = data.frame(text = lines, stringsAsFactors = FALSE),
             mapping = list(x_var = "text", y_var = "text"),
             options = list(position = "top-left"))
}
