#' Read a myDAR walk
#'
#' Reads the files a myDAR walk produces into plain data frames that the
#' \code{mydar_*_view()} functions plot. \code{read_mydar_walk()} reads a whole
#' output directory; the other functions read one file each.
#'
#' A walk directory holds \code{walk.copc.laz} (the point cloud),
#' \code{terrain.tif} (the DEM), \code{walk.gpkg} (track, GPS fixes, pins,
#' features and the \code{accuracy} table) and \code{trajectory.csv} (the
#' device poses). Walks recorded without LiDAR have no point cloud or DEM;
#' those parts of the result are \code{NULL}.
#'
#' The readers need packages that myIO does not install: \pkg{rlas} for the
#' point cloud, \pkg{terra} for the DEM and \pkg{sf} for the GeoPackage.
#'
#' @param dir Path to a walk output directory.
#' @param path Path to one walk file.
#' @param max_points Most points to keep from the cloud. Larger clouds are
#'   thinned by taking every k-th point in file order, which keeps the relative
#'   point density across the walk. Use \code{Inf} to keep every point.
#' @param max_cells Most DEM cells to keep. A larger DEM is aggregated by the
#'   smallest whole factor that brings it under the limit (cell mean).
#' @param local If \code{TRUE} (default), x and y of every spatial table are
#'   shifted to meters from a whole-meter origin at the south-west corner of
#'   the walk, so axes read in walk-scale meters. The origin is kept in
#'   \code{$origin}; add it back to recover project coordinates. Heights are
#'   never shifted. \code{trajectory.csv} is in its own local frame (meters east,
#'   north and up of the first GPS fix) and is left as written.
#'
#' @return \code{read_mydar_walk()} returns a \code{mydar_walk} list with
#'   \describe{
#'     \item{points}{One row per kept point: \code{point_id} (row in the file),
#'       \code{x}, \code{y}, \code{z}, \code{class} (LAS code),
#'       \code{class_name}, \code{sigma_m} (the file's per-point 1-sigma, per
#'       axis, in meters) and \code{source} (\code{"LiDAR"} or
#'       \code{"camera"}).}
#'     \item{terrain}{One row per DEM cell with a height: \code{x}, \code{y}
#'       (cell center) and \code{z}. Attribute \code{cell_size} holds the
#'       cell width and height.}
#'     \item{track}{Track vertices in walk order: \code{vertex}, \code{x},
#'       \code{y}, \code{z}.}
#'     \item{track_points}{Once-a-second track samples with \code{t_s} and
#'       \code{map_95_m}, the 95\% map-position radius at that time.}
#'     \item{gps_fixes}{GPS fixes with \code{t_s}, \code{h_acc_m},
#'       \code{used}, \code{residual_m}, \code{residual_95_m} and
#'       \code{map_95_m}.}
#'     \item{pins}{Control pins placed on the walk.}
#'     \item{features}{Named list, one data frame per feature layer, one row
#'       per vertex (\code{fid}, \code{vertex}, \code{x}, \code{y}, \code{z}
#'       and the layer's attributes).}
#'     \item{accuracy}{The one-row \code{accuracy} table.}
#'     \item{trajectory}{Poses from \code{trajectory.csv} with \code{t_s}
#'       (seconds from the first pose).}
#'     \item{crs}{The project CRS, e.g. \code{"EPSG:32612"}.}
#'     \item{origin}{The x/y origin subtracted when \code{local = TRUE}, else
#'       \code{c(x = 0, y = 0)}.}
#'   }
#'   The single-file readers return the matching element.
#'
#' @seealso \code{\link{mydar_dashboard}} and the other \code{mydar_*_view()}
#'   functions; \code{\link{mydar_iphone_walk}} for a walk that needs none of
#'   the optional packages.
#' @examples
#' \dontrun{
#' walk <- read_mydar_walk("path/to/walk", max_points = 20000)
#' walk
#' mydar_dashboard(walk)
#' }
#' @export
read_mydar_walk <- function(dir, max_points = 20000, max_cells = 40000, local = TRUE) {
  check_string(dir, "dir", "read_mydar_walk")
  check_flag(local, "local", "read_mydar_walk")
  if (!dir.exists(dir)) {
    stop("read_mydar_walk(): directory not found: ", dir, call. = FALSE)
  }
  file_in <- function(name) {
    p <- file.path(dir, name)
    if (file.exists(p)) p else NULL
  }
  gpkg_path <- file_in("walk.gpkg")
  if (is.null(gpkg_path)) {
    stop("read_mydar_walk(): no walk.gpkg in ", dir, ".", call. = FALSE)
  }

  gpkg <- read_mydar_gpkg(gpkg_path)
  laz <- file_in("walk.copc.laz")
  dem <- file_in("terrain.tif")
  traj <- file_in("trajectory.csv")

  walk <- c(
    list(
      points = if (!is.null(laz)) read_mydar_points(laz, max_points = max_points),
      terrain = if (!is.null(dem)) read_mydar_terrain(dem, max_cells = max_cells)
    ),
    gpkg,
    list(
      trajectory = if (!is.null(traj)) read_mydar_trajectory(traj),
      crs = if (nrow(gpkg$accuracy) > 0 && "crs" %in% names(gpkg$accuracy)) gpkg$accuracy$crs[[1]] else NA_character_,
      origin = c(x = 0, y = 0)
    )
  )

  if (isTRUE(local)) {
    walk <- mydar_shift_local(walk)
  }
  class(walk) <- "mydar_walk"
  walk
}

#' @rdname read_mydar_walk
#' @export
read_mydar_points <- function(path, max_points = 20000) {
  mydar_require("rlas", "read_mydar_points")
  mydar_check_file(path, "read_mydar_points")
  if (!is.numeric(max_points) || length(max_points) != 1L || is.na(max_points) || max_points < 1) {
    stop("read_mydar_points(): `max_points` must be a single number of at least 1.", call. = FALSE)
  }

  # myDAR flags camera points synthetic (LAS bit) by design; rlas warns about it.
  las <- withCallingHandlers(
    rlas::read.las(path, select = "xyzc0"),
    warning = function(w) {
      if (grepl("flagged 'synthetic'", conditionMessage(w), fixed = TRUE)) {
        invokeRestart("muffleWarning")
      }
    }
  )
  missing <- setdiff(c("sigma_m", "source"), names(las))
  if (length(missing) > 0L) {
    stop("read_mydar_points(): ", path, " has no extra bytes ",
         paste(missing, collapse = " and "), "; is it a myDAR walk cloud?", call. = FALSE)
  }

  n <- nrow(las)
  keep <- if (n > max_points) unique(round(seq(1, n, length.out = max_points))) else seq_len(n)
  class_code <- as.integer(las$Classification[keep])
  points <- data.frame(
    point_id = as.integer(keep),
    x = las$X[keep],
    y = las$Y[keep],
    z = las$Z[keep],
    class = class_code,
    class_name = mydar_class_name(class_code),
    sigma_m = as.numeric(las$sigma_m[keep]),
    source = ifelse(las$source[keep] == 1L, "camera", "LiDAR"),
    stringsAsFactors = FALSE
  )
  attr(points, "n_total") <- n
  points
}

#' @rdname read_mydar_walk
#' @export
read_mydar_terrain <- function(path, max_cells = 40000) {
  mydar_require("terra", "read_mydar_terrain")
  mydar_check_file(path, "read_mydar_terrain")
  if (!is.numeric(max_cells) || length(max_cells) != 1L || is.na(max_cells) || max_cells < 1) {
    stop("read_mydar_terrain(): `max_cells` must be a single number of at least 1.", call. = FALSE)
  }

  r <- terra::rast(path)[[1]]
  factor <- ceiling(sqrt(terra::ncell(r) / max_cells))
  if (factor > 1) {
    r <- terra::aggregate(r, fact = factor, fun = "mean", na.rm = TRUE)
  }
  cells <- terra::as.data.frame(r, xy = TRUE, na.rm = TRUE)
  terrain <- data.frame(x = cells[[1]], y = cells[[2]], z = as.numeric(cells[[3]]))
  terrain <- terrain[is.finite(terrain$z), , drop = FALSE]
  rownames(terrain) <- NULL
  attr(terrain, "cell_size") <- as.numeric(terra::res(r))
  terrain
}

#' @rdname read_mydar_walk
#' @export
read_mydar_gpkg <- function(path) {
  mydar_require("sf", "read_mydar_gpkg")
  mydar_check_file(path, "read_mydar_gpkg")

  info <- sf::st_layers(path)
  names_all <- info$name
  has_geom <- !is.na(vapply(info$geomtype, function(g) as.character(g[1]), character(1)))
  read <- function(name) {
    if (!(name %in% names_all)) return(NULL)
    suppressWarnings(sf::st_read(path, layer = name, quiet = TRUE, stringsAsFactors = FALSE))
  }

  core <- c("track", "track_points", "gps_fixes", "pins", "loops", "photos")
  feature_layers <- setdiff(names_all[has_geom], core)
  features <- lapply(feature_layers, function(name) mydar_vertices(read(name)))
  names(features) <- feature_layers

  track <- mydar_vertices(read("track"))
  if (!is.null(track)) {
    track <- track[, c("vertex", "x", "y", "z"), drop = FALSE]
  }

  accuracy <- read("accuracy")
  accuracy <- if (is.null(accuracy)) data.frame() else as.data.frame(accuracy)

  list(
    track = track,
    track_points = mydar_vertices(read("track_points")),
    gps_fixes = mydar_vertices(read("gps_fixes")),
    pins = mydar_vertices(read("pins")),
    features = features,
    accuracy = accuracy
  )
}

#' @rdname read_mydar_walk
#' @export
read_mydar_trajectory <- function(path) {
  mydar_check_file(path, "read_mydar_trajectory")
  traj <- utils::read.csv(path, colClasses = "numeric")
  if (!all(c("t_ns", "x", "y", "z") %in% names(traj))) {
    stop("read_mydar_trajectory(): ", path, " needs columns t_ns, x, y and z.", call. = FALSE)
  }
  traj$t_s <- (traj$t_ns - traj$t_ns[1]) / 1e9
  traj[, c("t_s", setdiff(names(traj), "t_s"))]
}

#' @export
print.mydar_walk <- function(x, ...) {
  rows <- function(df) if (is.null(df)) "none" else format(nrow(df), big.mark = ",")
  n_total <- attr(x$points, "n_total")
  cat("<mydar_walk>", if (!is.na(x$crs)) paste0(" ", x$crs), "\n", sep = "")
  cat("  points:       ", rows(x$points),
      if (!is.null(n_total) && n_total > nrow(x$points)) paste0(" of ", format(n_total, big.mark = ",")),
      "\n", sep = "")
  cat("  terrain:      ", rows(x$terrain), " cells\n", sep = "")
  cat("  track:        ", rows(x$track), " vertices\n", sep = "")
  cat("  gps_fixes:    ", rows(x$gps_fixes), "\n", sep = "")
  cat("  features:     ", if (length(x$features)) paste(names(x$features), collapse = ", ") else "none", "\n", sep = "")
  cat("  trajectory:   ", rows(x$trajectory), " poses\n", sep = "")
  if (anyNA(x$origin)) {
    cat("  local coordinates (origin withheld)\n")
  } else if (any(x$origin != 0)) {
    cat("  local origin: ", format(x$origin[["x"]], nsmall = 0), ", ", format(x$origin[["y"]], nsmall = 0), "\n", sep = "")
  }
  invisible(x)
}

MYDAR_CLASSES <- data.frame(
  class = c(0L, 1L, 2L, 3L, 4L, 5L, 6L, 9L, 11L),
  class_name = c("Never classified", "Unclassified", "Ground", "Low vegetation",
                 "Medium vegetation", "High vegetation", "Building", "Water", "Road"),
  color = c("#BBBBBB", "#777777", "#8C6D31", "#A6D96A", "#009E73", "#00573F",
            "#D55E00", "#0072B2", "#E69F00"),
  stringsAsFactors = FALSE
)

mydar_class_name <- function(code) {
  name <- MYDAR_CLASSES$class_name[match(code, MYDAR_CLASSES$class)]
  ifelse(is.na(name), paste("Class", code), name)
}

mydar_require <- function(pkg, caller) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    stop(caller, "() needs the '", pkg, "' package. Install it with: install.packages('",
         pkg, "')", call. = FALSE)
  }
  invisible(TRUE)
}

mydar_check_file <- function(path, caller) {
  check_string(path, "path", caller)
  if (!file.exists(path)) {
    stop(caller, "(): file not found: ", path, call. = FALSE)
  }
  invisible(TRUE)
}

# sf layer -> data frame with one row per vertex (x, y, z) and the layer's
# attributes. Empty geometries keep their row with NA coordinates.
mydar_vertices <- function(layer) {
  if (is.null(layer)) return(NULL)
  # sf hands back a plain data frame for a layer with no rows.
  if (!inherits(layer, "sf")) {
    attrs <- as.data.frame(layer)[0, setdiff(names(layer), c("geom", "geometry")), drop = FALSE]
    geom <- list()
  } else {
    attrs <- sf::st_drop_geometry(layer)
    geom <- sf::st_geometry(layer)
  }
  if (length(geom) == 0L) {
    attrs$fid <- integer(0)
    attrs$vertex <- integer(0)
    attrs$x <- attrs$y <- attrs$z <- numeric(0)
    return(attrs)
  }
  pieces <- lapply(seq_along(geom), function(i) {
    g <- geom[[i]]
    xyz <- if (sf::st_is_empty(g)) matrix(NA_real_, 1, 3) else {
      m <- sf::st_coordinates(g)
      cbind(m[, "X"], m[, "Y"], if ("Z" %in% colnames(m)) m[, "Z"] else NA_real_)
    }
    data.frame(row = i, vertex = seq_len(nrow(xyz)), x = xyz[, 1], y = xyz[, 2], z = xyz[, 3])
  })
  v <- do.call(rbind, pieces)
  out <- cbind(attrs[v$row, , drop = FALSE], v[, c("vertex", "x", "y", "z")])
  if (!"fid" %in% names(out)) out$fid <- v$row
  rownames(out) <- NULL
  out
}

mydar_shift_local <- function(walk) {
  spatial <- c("points", "terrain", "track", "track_points", "gps_fixes", "pins")
  xs <- c(); ys <- c()
  for (name in spatial) {
    df <- walk[[name]]
    if (!is.null(df) && nrow(df) > 0) { xs <- c(xs, df$x); ys <- c(ys, df$y) }
  }
  for (df in walk$features) {
    if (nrow(df) > 0) { xs <- c(xs, df$x); ys <- c(ys, df$y) }
  }
  if (!any(is.finite(xs))) return(walk)
  origin <- c(x = floor(min(xs, na.rm = TRUE)), y = floor(min(ys, na.rm = TRUE)))
  shift <- function(df) {
    if (is.null(df)) return(NULL)
    keep <- attributes(df)[c("cell_size", "n_total")]
    df$x <- df$x - origin[["x"]]
    df$y <- df$y - origin[["y"]]
    for (a in names(keep)) if (!is.null(keep[[a]])) attr(df, a) <- keep[[a]]
    df
  }
  for (name in spatial) walk[[name]] <- shift(walk[[name]])
  walk$features <- lapply(walk$features, shift)
  walk$origin <- origin
  walk
}
