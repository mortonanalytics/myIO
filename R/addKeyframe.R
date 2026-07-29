#' Add a Named Data Keyframe
#'
#' Registers a named data state for sequential chart storytelling. A chart with
#' one serialized layer accepts a data frame directly. Multi-layer charts use a
#' named list of data frames keyed by existing layer labels; omitted layers
#' retain their data from the previous keyframe.
#'
#' @param myIO A widget created by \code{\link{myIO}()} with at least one layer.
#' @param data A data frame for a single-layer chart, or a named list of data
#'   frames keyed by layer label for a multi-layer chart.
#' @param label A unique, non-empty keyframe label.
#' @return A modified \code{myIO} widget with the keyframe appended.
#' @examples
#' start <- data.frame(x = 1:3, y = c(2, 4, 3))
#' finish <- data.frame(x = 1:3, y = c(5, 3, 7))
#' myIO(start) |>
#'   addIoLayer("line", label = "series",
#'     mapping = list(x_var = "x", y_var = "y")) |>
#'   addKeyframe(start, "Start") |>
#'   addKeyframe(finish, "Finish")
#' @export
addKeyframe <- function(myIO, data, label) {
  assert_myIO(myIO)
  layers <- myIO$x$config$layers
  if (length(layers) == 0L) {
    stop("addKeyframe(): the chart must have at least one layer.", call. = FALSE)
  }
  if (!is.character(label) || length(label) != 1L || is.na(label) ||
      !nzchar(trimws(label))) {
    stop("addKeyframe(): label must be a single non-empty string.", call. = FALSE)
  }

  keyframes <- myIO$x$config$keyframes
  if (is.null(keyframes)) keyframes <- list()
  existing_labels <- vapply(keyframes, function(frame) frame[["label"]], character(1))
  if (label %in% existing_labels) {
    stop("addKeyframe(): label must be unique; '", label, "' already exists.",
         call. = FALSE)
  }

  layer_labels <- vapply(layers, function(layer) layer[["label"]], character(1))
  if (is.data.frame(data)) {
    if (length(layers) != 1L) {
      stop("addKeyframe(): multi-layer charts require a named list of data frames.",
           call. = FALSE)
    }
    updates <- stats::setNames(list(data), layer_labels[[1]])
  } else if (is.list(data)) {
    update_names <- names(data)
    if (length(data) == 0L || is.null(update_names) ||
        any(is.na(update_names)) || any(!nzchar(update_names))) {
      stop("addKeyframe(): data must be a non-empty named list keyed by layer label.",
           call. = FALSE)
    }
    if (anyDuplicated(update_names)) {
      stop("addKeyframe(): layer names in data must be unique.", call. = FALSE)
    }
    unknown <- setdiff(update_names, layer_labels)
    if (length(unknown) > 0L) {
      stop("addKeyframe(): unknown layer label(s): ", paste(unknown, collapse = ", "),
           ".", call. = FALSE)
    }
    invalid <- update_names[!vapply(data, is.data.frame, logical(1))]
    if (length(invalid) > 0L) {
      stop("addKeyframe(): data for layer '", invalid[[1]], "' must be a data frame.",
           call. = FALSE)
    }
    updates <- data
  } else {
    stop("addKeyframe(): data must be a data frame or named list of data frames.",
         call. = FALSE)
  }

  prior_layers <- if (length(keyframes) > 0L) keyframes[[length(keyframes)]]$layers else
    lapply(layers, function(layer) list(label = layer$label, data = layer$data))
  prior_by_label <- stats::setNames(
    prior_layers,
    vapply(prior_layers, function(layer) layer[["label"]], character(1))
  )
  snapshot <- lapply(seq_along(layers), function(index) {
    layer <- layers[[index]]
    layer_label <- layer$label
    if (layer_label %in% names(updates)) {
      list(label = layer_label, data = serialize_keyframe_data(layer, updates[[layer_label]]))
    } else {
      list(label = layer_label, data = prior_by_label[[layer_label]]$data)
    }
  })

  myIO$x$config$keyframes <- c(keyframes, list(list(label = label, layers = snapshot)))
  myIO
}

serialize_keyframe_data <- function(layer, data) {
  data <- ensure_source_key(data)
  transform <- if (is.null(layer$transform)) "identity" else layer$transform
  transformed <- get_transform(transform)(data, layer$mapping, layer$options)
  transformed_data <- transformed$data
  if (identical(layer$type, "treemap")) {
    return(build_tree(transformed_data, layer$label,
      layer$mapping$level_1, layer$mapping$level_2))
  }
  as_layer_rows(transformed_data)
}

#' Control Keyframes in Shiny
#'
#' Select a named or numbered keyframe, or step an existing myIO widget without
#' re-rendering the widget.
#'
#' @param proxy A \code{myIO_proxy} object returned by \code{\link{myIOProxy}()}.
#' @param frame A unique keyframe label or positive one-based keyframe index.
#' @param direction Either \code{"next"} or \code{"previous"}.
#' @return The proxy, invisibly.
#' @examples
#' \dontrun{
#' myIOProxy("chart") |> setKeyframe("Forecast")
#' myIOProxy("chart") |> stepKeyframe("next")
#' }
#' @export
setKeyframe <- function(proxy, frame) {
  assert_keyframe_proxy(proxy, "setKeyframe")
  valid_character <- is.character(frame) && length(frame) == 1L &&
    !is.na(frame) && nzchar(trimws(frame))
  valid_numeric <- is.numeric(frame) && length(frame) == 1L && !is.na(frame) &&
    is.finite(frame) && frame >= 1 && frame <= .Machine$integer.max &&
    frame == floor(frame)
  if (!valid_character && !valid_numeric) {
    if (is.numeric(frame) && length(frame) == 1L && !is.na(frame) && frame < 1) {
      stop("setKeyframe(): numeric frame must be a positive one-based index.",
           call. = FALSE)
    }
    stop("setKeyframe(): frame must be a single non-empty label or positive one-based index.",
         call. = FALSE)
  }
  if (valid_numeric) frame <- as.integer(frame)
  proxy$session$sendCustomMessage(
    "myio:keyframe-control",
    list(id = proxy$id, action = "select", frame = frame)
  )
  invisible(proxy)
}

#' @rdname setKeyframe
#' @export
stepKeyframe <- function(proxy, direction = c("next", "previous")) {
  assert_keyframe_proxy(proxy, "stepKeyframe")
  direction <- match.arg(direction)
  proxy$session$sendCustomMessage(
    "myio:keyframe-control",
    list(id = proxy$id, action = "step", direction = direction)
  )
  invisible(proxy)
}

assert_keyframe_proxy <- function(proxy, caller) {
  if (!inherits(proxy, "myIO_proxy")) {
    stop(caller, "(): proxy must be a myIOProxy() object.", call. = FALSE)
  }
}
