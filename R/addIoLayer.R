#' addLayer()
#'
#' Adds individual layer to a myIO widget
#'
#' @param myIO an htmlwidget object created by the `myIO()` function
#' @param type chart type
#' @param color optional CSS color string or vector for grouped layers
#' @param label unique layer label
#' @param data data frame backing the layer
#' @param mapping named aesthetic mapping list
#' @param transform transform name applied before serialization
#' @param options layer options passed through to the widget config
#'
#' @examples
#' myIO(data = mtcars) |>
#'   addIoLayer(
#'     type = "point", label = "points",
#'     mapping = list(x_var = "wt", y_var = "mpg")
#'   )
#'
#' @export
addIoLayer <- function(myIO,
                       type,
                       color = NULL,
                       label,
                       data = NULL,
                       mapping,
                       transform = "identity",
                       options = list(barSize = "large",
                                      toolTipOptions = list(suppressY = FALSE))) {
  assert_myIO(myIO)

  existing_layers <- myIO$x$config$layers

  if (is.null(data)) {
    data <- myIO$x$data
  }
  data <- ensure_source_key(data)

  validate_layer_inputs(type, transform, mapping, label, data, existing_layers)

  presets <- list(barSize = "large", toolTipOptions = list(suppressY = FALSE))
  if (is.null(options)) {
    options <- presets
  }

  check_layer_compatibility(type, existing_layers)

  transform_fn <- get_transform(transform)
  if (!(transform %in% VALID_COMBINATIONS[[type]])) {
    stop("Transform '", transform, "' is not valid for layer type '", type, "'.", call. = FALSE)
  }
  layer_id <- next_layer_id(existing_layers)

  if (length(grep("group", names(mapping))) == 0) {
    transformed <- transform_fn(data, mapping, options)
    transformed_data <- transformed$data

    if (type == "treemap") {
      layer_data <- build_tree(transformed_data, label, mapping$level_1, mapping$level_2)
    } else {
      layer_data <- as_layer_rows(transformed_data)
    }

    myIO$x$config$layers <- c(
      myIO$x$config$layers,
      list(build_layer(
        layer_type = type,
        layer_label = label,
        layer_data = layer_data,
        layer_mapping = mapping,
        layer_color = color,
        layer_transform_meta = transformed$meta,
        options = options,
        transform = transform,
        layer_id = layer_id,
        order = 1L
      ))
    )
    return(myIO)
  }

  myIO$x$config$layers <- c(
    myIO$x$config$layers,
    build_grouped_layers(data, mapping, type, label, color, transform_fn, options, layer_id, transform, existing_layers)
  )

  myIO
}

build_layer <- function(layer_type, layer_label, layer_data, layer_mapping, layer_color,
                        layer_transform_meta, options, transform, layer_id, order,
                        derived_from = NULL, composite = NULL, composite_role = NULL) {
  layer <- list(
    id = if (order == 1L) layer_id else sprintf("%s_sub_%02d", layer_id, order),
    type = layer_type,
    color = layer_color,
    label = layer_label,
    data = layer_data,
    mapping = layer_mapping,
    options = options,
    transform = transform,
    transformMeta = layer_transform_meta,
    encoding = list(),
    sourceKey = "_source_key",
    derivedFrom = derived_from,
    order = order,
    visibility = TRUE
  )
  if (!is.null(composite)) {
    layer$`_composite` <- composite
    layer$`_compositeRole` <- composite_role
  }
  layer
}

validate_layer_inputs <- function(type, transform, mapping, label, data, existing_layers) {
  if (!is.character(type) || length(type) != 1 || is.na(type) || !(type %in% ALLOWED_TYPES)) {
    stop("Unknown layer type '", paste(type, collapse = ", "), "'. Must be one of: ",
         paste(ALLOWED_TYPES, collapse = ", "), ".", call. = FALSE)
  }
  if (!is.character(transform) || length(transform) != 1 || is.na(transform)) {
    stop("'transform' must be a single character string.", call. = FALSE)
  }
  if (!is.list(mapping)) {
    stop("'mapping' must be a list, e.g. list(x_var = 'col1', y_var = 'col2').", call. = FALSE)
  }
  if (!is.character(label) || length(label) != 1 || is.na(label)) {
    stop("'label' must be a single character string.", call. = FALSE)
  }
  if (is.null(data)) {
    stop("'data' must be provided either in addIoLayer() or myIO().", call. = FALSE)
  }

  if (!("group" %in% names(mapping))) {
    existing_labels <- vapply(existing_layers, function(layer) layer$label, character(1))
    if (label %in% existing_labels) {
      stop("Layer label '", label, "' already exists.", call. = FALSE)
    }
  }

  required_map <- switch(type,
    treemap = c("level_1", "level_2"),
    gauge = c("value"),
    histogram = c("value"),
    area = c("x_var", "low_y", "high_y"),
    c("x_var", "y_var")
  )
  missing_map <- setdiff(required_map, names(mapping))
  if (length(missing_map) > 0) {
    stop("Missing required mapping: ", paste(missing_map, collapse = ", "), call. = FALSE)
  }

  mapped_fields <- intersect(c("x_var", "y_var", "group", "level_1", "level_2", "value", "low_y", "high_y"), names(mapping))
  for (field in mapped_fields) {
    if (!mapping[[field]] %in% colnames(data)) {
      stop("Mapping variable '", mapping[[field]], "' not found in data.", call. = FALSE)
    }
  }

  numeric_fields <- intersect(c("y_var", "value", "low_y", "high_y"), names(mapping))
  if (type %in% c("line", "point", "bar", "hexbin", "area", "groupedBar", "histogram", "gauge", "donut")) {
    for (nf in numeric_fields) {
      if (!is.numeric(data[[mapping[[nf]]]])) {
        stop("Mapped field '", mapping[[nf]], "' must be numeric for type '", type, "'.", call. = FALSE)
      }
    }
  }

  invisible(NULL)
}

check_layer_compatibility <- function(type, existing_layers) {
  new_group <- COMPATIBILITY_GROUPS[[type]]
  current_groups <- unique(vapply(existing_layers, function(layer) COMPATIBILITY_GROUPS[[layer$type]], character(1)))
  if (length(current_groups) == 0) {
    return(invisible(NULL))
  }

  incompatible <- vapply(current_groups, function(group) !(new_group %in% GROUP_MATRIX[[group]]), logical(1))
  if (!any(incompatible)) {
    return(invisible(NULL))
  }

  conflict_group <- current_groups[[which(incompatible)[1]]]
  allowed_types <- names(Filter(function(group) group %in% GROUP_MATRIX[[conflict_group]], COMPATIBILITY_GROUPS))
  stop(
    "Cannot add layer type '", type, "' because it is incompatible with existing group '", conflict_group,
    "'. Compatible layer types here are: ", paste(sort(unique(allowed_types)), collapse = ", "), ".",
    call. = FALSE
  )
}

build_grouped_layers <- function(data, mapping, type, label, color, transform_fn, options, layer_id,
                                 transform = "identity", existing_layers = list()) {
  group_list <- unique(data[[mapping$group]])
  if (is.null(color)) {
    color <- rep_len(OKABE_ITO_PALETTE, length(group_list))
  } else {
    color <- rep_len(color, length(group_list))
  }

  layers <- list()
  existing_labels <- vapply(existing_layers, function(layer) layer$label, character(1))

  for (index in seq_along(group_list)) {
    group_value <- group_list[[index]]
    layer_label <- paste0(label, " \u2014 ", as.character(group_value))
    all_labels <- c(existing_labels, vapply(layers, function(layer) layer$label, character(1)))
    if (layer_label %in% all_labels) {
      stop("Layer label '", layer_label, "' already exists.", call. = FALSE)
    }

    temp_df <- data[data[[mapping$group]] == group_value, , drop = FALSE]
    transformed <- transform_fn(temp_df, mapping, options)
    layers[[length(layers) + 1L]] <- build_layer(
      layer_type = type,
      layer_label = layer_label,
      layer_data = as_layer_rows(transformed$data),
      layer_mapping = mapping,
      layer_color = color[[index]],
      layer_transform_meta = transformed$meta,
      options = options,
      transform = transform,
      layer_id = layer_id,
      order = index,
      derived_from = layer_id
    )
  }

  layers
}
