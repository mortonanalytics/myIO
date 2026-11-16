# Packs a point cloud for the "pointcloud" layer type: the widget gets typed
# arrays as base64 instead of one JSON object per point.
#   positions: Uint16 x, y, z interleaved, scaled to bbox
#   rgb:       Uint8 r, g, b interleaved (mapping red/green/blue, 0-255)
#   cls:       Uint8 class code (mapping class)
#   sigma:     Uint8, (log10(sigma_m) + 3) / 4 * 255, i.e. 1 mm to 10 m
pointcloud_payload <- function(data, mapping) {
  col <- function(key) if (is.null(mapping[[key]])) NULL else as.numeric(data[[mapping[[key]]]])
  x <- col("x_var")
  y <- col("y_var")
  z <- col("z_var")
  keep <- is.finite(x) & is.finite(y) & is.finite(z)
  if (!any(keep)) {
    stop("addIoLayer(): type 'pointcloud' needs at least one point with finite x, y and z.", call. = FALSE)
  }
  x <- x[keep]
  y <- y[keep]
  z <- z[keep]
  bbox <- c(range(x), range(y), range(z))
  quantize <- function(v, lo, hi) {
    span <- if (hi > lo) hi - lo else 1
    as.integer(round((v - lo) / span * 65535))
  }
  q <- quantize
  positions <- as.vector(rbind(q(x, bbox[1], bbox[2]), q(y, bbox[3], bbox[4]), q(z, bbox[5], bbox[6])))
  bytes <- function(v, size) writeBin(as.integer(v), raw(), size = size, endian = "little")
  b64 <- function(v, size) jsonlite::base64_enc(bytes(v, size))
  byte <- function(v) pmin(255L, pmax(0L, as.integer(round(v))))

  out <- list(
    n = sum(keep),
    bbox = bbox,
    positions = b64(positions, 2)
  )
  rgb <- lapply(c("red", "green", "blue"), col)
  if (all(!vapply(rgb, is.null, logical(1)))) {
    out$rgb <- b64(as.vector(do.call(rbind, lapply(rgb, function(v) byte(v[keep])))), 1)
  }
  cls <- col("class")
  if (!is.null(cls)) out$cls <- b64(byte(cls[keep]), 1)
  sigma <- col("sigma")
  if (!is.null(sigma)) {
    s <- sigma[keep]
    out$sigma <- b64(byte((log10(pmax(s, 1e-3)) + 3) / 4 * 255), 1)
  }
  out
}

#' Equal Units per Pixel on x and y
#'
#' Makes one unit on the x axis as long on screen as one unit on the y axis,
#' for maps, plans and images where x and y are the same kind of distance. The
#' tighter axis is widened about its center; any limits from
#' \code{\link{setAxisLimits}} still set where the view starts.
#'
#' @param myIO A myIO widget.
#' @param enabled \code{TRUE} (default) to turn equal aspect on, \code{FALSE}
#'   to turn it off.
#' @return A modified \code{myIO} widget.
#' @examples
#' grid <- expand.grid(x = seq(0, 10, by = 0.5), y = seq(0, 4, by = 0.5))
#' grid$v <- grid$x * grid$y
#' myIO() |>
#'   addIoLayer(type = "raster", label = "v", data = grid,
#'              mapping = list(x_var = "x", y_var = "y", value = "v")) |>
#'   setEqualAspect()
#' @export
setEqualAspect <- function(myIO, enabled = TRUE) {
  assert_myIO(myIO)
  check_flag(enabled, "enabled", "setEqualAspect")
  myIO$x$config$scales$equalAspect <- enabled
  myIO
}
