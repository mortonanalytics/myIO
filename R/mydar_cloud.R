#' The bundled myDAR walk's point cloud
#'
#' 500,000 of the 887,038 points of \code{\link{mydar_iphone_walk}}, in the same
#' local coordinates, for the 3D view (\code{\link{mydar_cloud_view}}). The
#' points ship as a compressed binary file in \code{inst/extdata}, with x, y
#' and z stored to a fraction of a millimeter, colors as 8-bit RGB, and sigma
#' to about 4\% of its value.
#'
#' @return A data frame with \code{x}, \code{y}, \code{z}, \code{class},
#'   \code{class_name}, \code{sigma_m}, \code{source}, \code{r}, \code{g} and
#'   \code{b}, one row per point.
#' @seealso \code{\link{read_mydar_points}} reads every point of a walk on
#'   disk.
#' @examples
#' cloud <- mydar_iphone_cloud()
#' nrow(cloud)
#' table(cloud$class_name)
#' @export
mydar_iphone_cloud <- function() {
  path <- system.file("extdata", "mydar-iphone-walk-cloud.bin", package = "myIO")
  if (!nzchar(path)) {
    stop("mydar_iphone_cloud(): the bundled cloud file is missing from this installation.", call. = FALSE)
  }
  mydar_read_cloud(path)
}

# Binary cloud file (xz-compressed):
#   "MYDARPC1", n (int32), bbox (6 float64: xmin xmax ymin ymax zmin zmax),
#   then n Uint16 x, n Uint16 y, n Uint16 z (scaled to bbox), n Uint8 r, g, b,
#   n Uint8 class, n Uint8 sigma (log scale as in pointcloud_payload()),
#   n Uint8 source (0 LiDAR, 1 camera). Little-endian.
MYDAR_CLOUD_MAGIC <- "MYDARPC1"

mydar_write_cloud <- function(points, path) {
  con <- xzfile(path, "wb", compression = 9)
  on.exit(close(con))
  n <- nrow(points)
  bbox <- c(range(points$x), range(points$y), range(points$z))
  q <- function(v, lo, hi) as.integer(round((v - lo) / (if (hi > lo) hi - lo else 1) * 65535))
  # Neighbors next to each other in the file compress better; order does not
  # matter to the view.
  points <- points[order(q(points$x, bbox[1], bbox[2]) %/% 256L, q(points$y, bbox[3], bbox[4]) %/% 256L,
                         points$z), , drop = FALSE]
  u8 <- function(v) writeBin(pmin(255L, pmax(0L, as.integer(round(v)))), con, size = 1, endian = "little")
  writeChar(MYDAR_CLOUD_MAGIC, con, eos = NULL)
  writeBin(as.integer(n), con, size = 4, endian = "little")
  writeBin(as.double(bbox), con, size = 8, endian = "little")
  writeBin(q(points$x, bbox[1], bbox[2]), con, size = 2, endian = "little")
  writeBin(q(points$y, bbox[3], bbox[4]), con, size = 2, endian = "little")
  writeBin(q(points$z, bbox[5], bbox[6]), con, size = 2, endian = "little")
  u8(points$r)
  u8(points$g)
  u8(points$b)
  u8(points$class)
  u8((log10(pmax(points$sigma_m, 1e-3)) + 3) / 4 * 255)
  u8(as.integer(points$source == "camera"))
  invisible(path)
}

mydar_read_cloud <- function(path) {
  con <- xzfile(path, "rb")
  on.exit(close(con))
  magic <- readChar(con, nchar(MYDAR_CLOUD_MAGIC), useBytes = TRUE)
  if (!identical(magic, MYDAR_CLOUD_MAGIC)) {
    stop("mydar_read_cloud(): ", path, " is not a myDAR cloud file.", call. = FALSE)
  }
  n <- readBin(con, "integer", 1, size = 4, endian = "little")
  bbox <- readBin(con, "double", 6, size = 8, endian = "little")
  u16 <- function() readBin(con, "integer", n, size = 2, signed = FALSE, endian = "little")
  u8 <- function() readBin(con, "integer", n, size = 1, signed = FALSE, endian = "little")
  scale <- function(v, lo, hi) lo + v / 65535 * (hi - lo)
  x <- scale(u16(), bbox[1], bbox[2])
  y <- scale(u16(), bbox[3], bbox[4])
  z <- scale(u16(), bbox[5], bbox[6])
  r <- u8()
  g <- u8()
  b <- u8()
  cls <- u8()
  sigma <- 10^(u8() / 255 * 4 - 3)
  source <- ifelse(u8() == 1L, "camera", "LiDAR")
  data.frame(x = x, y = y, z = z, class = cls, class_name = mydar_class_name(cls),
             sigma_m = sigma, source = source, r = r, g = g, b = b,
             stringsAsFactors = FALSE)
}
