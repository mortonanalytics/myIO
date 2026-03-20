#' Density transform
#'
#' @keywords internal
transform_density <- function(data, mapping, options = list()) {
  values <- data[[mapping$y_var]]
  values <- values[!is.na(values)]

  if (length(values) == 0L) {
    empty <- data.frame(x_var = numeric(0), low_y = numeric(0), high_y = numeric(0))
    return(list(
      data = empty,
      meta = new_transform_meta(
        "density",
        list(
          sourceKeys = list(),
          derivedFrom = "input_rows"
        )
      )
    ))
  }

  bandwidth <- if (is.null(options$bandwidth)) "nrd0" else options$bandwidth
  density_estimate <- stats::density(values, bw = bandwidth, n = 128L)
  high_y <- density_estimate$y
  low_y <- if (isTRUE(options$mirror)) -high_y else rep(0, length(high_y))

  transformed <- data.frame(
    x_var = density_estimate$x,
    low_y = low_y,
    high_y = high_y,
    stringsAsFactors = FALSE
  )

  list(
    data = transformed,
    meta = new_transform_meta(
      "density",
      list(
        sourceKeys = list(as.character(data[["_source_key"]])),
        derivedFrom = "input_rows"
      )
    )
  )
}
