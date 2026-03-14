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

  allowed_types <- c("line", "point", "bar", "hexbin", "treemap", "gauge",
                     "donut", "area", "groupedBar", "histogram")
  compatibility_groups <- list(
    line = "axes-continuous",
    point = "axes-continuous",
    area = "axes-continuous",
    bar = "axes-categorical",
    groupedBar = "axes-categorical",
    histogram = "axes-binned",
    hexbin = "axes-hex",
    treemap = "standalone-treemap",
    donut = "standalone-donut",
    gauge = "standalone-gauge"
  )
  group_matrix <- list(
    "axes-continuous" = c("axes-continuous", "axes-categorical", "axes-binned"),
    "axes-categorical" = c("axes-continuous", "axes-categorical"),
    "axes-binned" = c("axes-continuous", "axes-binned"),
    "axes-hex" = c("axes-hex"),
    "standalone-treemap" = c("standalone-treemap"),
    "standalone-donut" = c("standalone-donut"),
    "standalone-gauge" = c("standalone-gauge")
  )
  valid_combinations <- list(
    line = c("identity", "lm"),
    point = c("identity"),
    area = c("identity"),
    bar = c("identity"),
    groupedBar = c("identity"),
    histogram = c("identity"),
    hexbin = c("identity"),
    treemap = c("identity"),
    donut = c("identity"),
    gauge = c("identity")
  )

  if (!is.character(type) || length(type) != 1 || is.na(type) || !(type %in% allowed_types)) {
    stop("Unknown layer type '", paste(type, collapse = ", "), "'. Must be one of: ",
         paste(allowed_types, collapse = ", "), ".", call. = FALSE)
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

  existing_layers <- myIO$x$config$layers
  existing_labels <- vapply(existing_layers, function(layer) layer$label, character(1))
  if (label %in% existing_labels) {
    stop("Layer label '", label, "' already exists.", call. = FALSE)
  }

  if (is.null(data)) {
    data <- myIO$x$data
  }
  myIO$x$data <- NULL
  data <- ensure_source_key(data)

  if (type %in% names(composite_registry())) {
    composite_layers <- expandComposite(type, label, data, mapping, options, color, existing_layers)
    myIO$x$config$layers <- c(myIO$x$config$layers, composite_layers)
    return(myIO)
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

  numeric_field <- intersect(c("y_var", "value", "low_y", "high_y"), names(mapping))
  if (type %in% c("line", "point", "bar", "hexbin", "area", "groupedBar", "histogram", "gauge", "donut") &&
      length(numeric_field) > 0 &&
      !is.numeric(data[[mapping[[numeric_field[1]]]]])) {
    stop("Mapped field '", mapping[[numeric_field[1]]], "' must be numeric for type '", type, "'.", call. = FALSE)
  }

  presets <- list(barSize = "large", toolTipOptions = list(suppressY = FALSE))
  if (is.null(options)) {
    options <- presets
  }

  new_group <- compatibility_groups[[type]]
  current_groups <- unique(vapply(existing_layers, function(layer) compatibility_groups[[layer$type]], character(1)))
  if (length(current_groups) > 0) {
    incompatible <- vapply(current_groups, function(group) !(new_group %in% group_matrix[[group]]), logical(1))
    if (any(incompatible)) {
      conflict_group <- current_groups[[which(incompatible)[1]]]
      stop("Cannot mix layer groups '", new_group, "' and '", conflict_group, "'.", call. = FALSE)
    }
  }

  transform_fn <- get_transform(transform)
  if (!(transform %in% valid_combinations[[type]])) {
    stop("Transform '", transform, "' is not valid for layer type '", type, "'.", call. = FALSE)
  }
  layer_id <- next_layer_id(existing_layers)

  build_layer <- function(layer_type, layer_label, layer_data, layer_mapping, layer_color,
                          layer_transform_meta, order, derived_from = NULL,
                          composite = NULL, composite_role = NULL) {
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
      list(build_layer(type, label, layer_data, mapping, color, transformed$meta, 1L))
    )
    return(myIO)
  }

  groupList <- unique(data[[mapping$group]])
  if (is.null(color)) {
    color <- rep_len(OKABE_ITO_PALETTE, length(groupList))
  } else {
    color <- rep_len(color, length(groupList))
  }

  for (index in seq_along(groupList)) {
    group_value <- groupList[[index]]
    temp_df <- data[data[[mapping$group]] == group_value, , drop = FALSE]
    transformed <- transform_fn(temp_df, mapping, options)
    myIO$x$config$layers <- c(
      myIO$x$config$layers,
      list(build_layer(
      layer_type = type,
      layer_label = as.character(group_value),
      layer_data = as_layer_rows(transformed$data),
      layer_mapping = mapping,
      layer_color = color[[index]],
      layer_transform_meta = transformed$meta,
      order = index,
      derived_from = layer_id
      ))
    )
  }

  myIO
}
