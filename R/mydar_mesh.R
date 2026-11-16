#' @rdname read_mydar_walk
#' @param crs For \code{read_mydar_mesh()}: the CRS to put the mesh in, e.g.
#'   the walk's project CRS (\code{"EPSG:32612"}). The phone writes the mesh
#'   in meters east, north and up of a geodetic origin; with \code{crs} each
#'   vertex is converted through WGS84 latitude, longitude and ellipsoidal
#'   height into that CRS so it lines up with the point cloud. \code{NULL}
#'   keeps the file's frame.
#' @param max_triangles Most mesh triangles to keep; a larger mesh is
#'   simplified by merging the vertices that share a grid cell (cell mean
#'   position and color), using the smallest cell that fits.
#' @export
read_mydar_mesh <- function(path, crs = NULL, max_triangles = 20000) {
  mydar_check_file(path, "read_mydar_mesh")
  usda <- mydar_usdz_text(path)
  frame <- regmatches(usda, regexpr('(mydar|autodar)_frame = "[a-z]+"', usda))
  frame <- if (length(frame)) sub('.*"([a-z]+)"', "\\1", frame) else "local"
  num <- function(pattern) {
    m <- regmatches(usda, regexpr(paste0(pattern, " = \\[[^]]*\\]"), usda))
    if (!length(m)) stop("read_mydar_mesh(): ", path, " has no ", pattern, ".", call. = FALSE)
    body <- sub("^[^=]*=\\s*\\[", "", sub("\\]$", "", m))
    as.numeric(strsplit(gsub("[()]", "", body), ",\\s*")[[1]])
  }
  xyz <- matrix(num("point3f\\[\\] points"), ncol = 3, byrow = TRUE)
  rgb <- matrix(num("color3f\\[\\] primvars:displayColor"), ncol = 3, byrow = TRUE)
  counts <- num("int\\[\\] faceVertexCounts")
  if (any(counts != 3)) {
    stop("read_mydar_mesh(): only triangle meshes are supported.", call. = FALSE)
  }
  faces <- matrix(as.integer(num("int\\[\\] faceVertexIndices")), ncol = 3, byrow = TRUE)

  if (!is.null(crs) && identical(frame, "enu")) {
    mydar_require("sf", "read_mydar_mesh")
    o <- regmatches(usda, regexpr("(mydar|autodar)_enu_origin = \\([^)]*\\)", usda))
    origin <- as.numeric(strsplit(gsub(".*\\(|\\)", "", o), ",\\s*")[[1]])
    geo <- mydar_enu_to_geodetic(xyz, origin[1], origin[2], origin[3])
    xy <- sf::sf_project("EPSG:4326", crs, cbind(geo[, "lon"], geo[, "lat"]))
    xyz <- cbind(xy, geo[, "h"])
  }

  vertices <- data.frame(x = xyz[, 1], y = xyz[, 2], z = xyz[, 3],
                         r = as.integer(round(pmin(1, pmax(0, rgb[, 1])) * 255)),
                         g = as.integer(round(pmin(1, pmax(0, rgb[, 2])) * 255)),
                         b = as.integer(round(pmin(1, pmax(0, rgb[, 3])) * 255)))
  mesh <- list(vertices = vertices, faces = faces)
  if (nrow(faces) > max_triangles) mesh <- mydar_simplify_mesh(mesh, max_triangles)
  attr(mesh, "n_triangles_total") <- nrow(faces)
  mesh
}

# The walk.usda text inside a USDZ (an uncompressed zip), or the file itself
# when it is already .usda.
mydar_usdz_text <- function(path) {
  if (grepl("\\.usda$", path)) return(paste(readLines(path, warn = FALSE), collapse = "\n"))
  dir <- tempfile()
  on.exit(unlink(dir, recursive = TRUE), add = TRUE)
  files <- utils::unzip(path, exdir = dir)
  usda <- files[grepl("\\.usda$", files)]
  if (!length(usda)) stop("read_mydar_mesh(): ", path, " holds no .usda layer.", call. = FALSE)
  paste(readLines(usda[1], warn = FALSE), collapse = "\n")
}

# East/north/up meters about a WGS84 point -> latitude, longitude (degrees)
# and ellipsoidal height, the same way the myDAR core does it.
mydar_enu_to_geodetic <- function(enu, lat0, lon0, h0) {
  a <- 6378137
  f <- 1 / 298.257223563
  e2 <- f * (2 - f)
  p0 <- lat0 * pi / 180
  l0 <- lon0 * pi / 180
  n0 <- a / sqrt(1 - e2 * sin(p0)^2)
  origin <- c((n0 + h0) * cos(p0) * cos(l0), (n0 + h0) * cos(p0) * sin(l0), (n0 * (1 - e2) + h0) * sin(p0))
  # Columns of the ENU -> ECEF rotation: east, north, up.
  east <- c(-sin(l0), cos(l0), 0)
  north <- c(-sin(p0) * cos(l0), -sin(p0) * sin(l0), cos(p0))
  up <- c(cos(p0) * cos(l0), cos(p0) * sin(l0), sin(p0))
  X <- origin[1] + enu[, 1] * east[1] + enu[, 2] * north[1] + enu[, 3] * up[1]
  Y <- origin[2] + enu[, 1] * east[2] + enu[, 2] * north[2] + enu[, 3] * up[2]
  Z <- origin[3] + enu[, 1] * east[3] + enu[, 2] * north[3] + enu[, 3] * up[3]
  r <- sqrt(X^2 + Y^2)
  lon <- atan2(Y, X)
  lat <- atan2(Z, r * (1 - e2))
  h <- 0
  for (i in 1:6) {
    n <- a / sqrt(1 - e2 * sin(lat)^2)
    h <- r / cos(lat) - n
    lat <- atan2(Z, r * (1 - e2 * n / (n + h)))
  }
  cbind(lat = lat * 180 / pi, lon = lon * 180 / pi, h = h)
}

# Vertex clustering: vertices in the same cubic cell merge (mean position and
# color); triangles that collapse or repeat are dropped. The cell grows until
# the mesh has at most `max_triangles` triangles.
mydar_simplify_mesh <- function(mesh, max_triangles) {
  v <- mesh$vertices
  span <- max(diff(range(v$x)), diff(range(v$y)), diff(range(v$z)))
  cell <- span / 2000
  repeat {
    key <- paste(floor(v$x / cell), floor(v$y / cell), floor(v$z / cell))
    group <- match(key, unique(key))
    faces <- matrix(group[mesh$faces + 1L], ncol = 3)
    keep <- faces[, 1] != faces[, 2] & faces[, 2] != faces[, 3] & faces[, 1] != faces[, 3]
    faces <- faces[keep, , drop = FALSE]
    faces <- faces[!duplicated(t(apply(faces, 1, sort))), , drop = FALSE]
    if (nrow(faces) <= max_triangles) break
    cell <- cell * 1.25
  }
  agg <- function(col) as.vector(tapply(col, group, mean))
  vertices <- data.frame(x = agg(v$x), y = agg(v$y), z = agg(v$z),
                         r = as.integer(round(agg(v$r))), g = as.integer(round(agg(v$g))),
                         b = as.integer(round(agg(v$b))))
  # Drop vertices no triangle uses, and renumber from 0.
  used <- sort(unique(as.vector(faces)))
  list(vertices = vertices[used, , drop = FALSE], faces = matrix(match(faces, used) - 1L, ncol = 3))
}
