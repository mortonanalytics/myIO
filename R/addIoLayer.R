#' addLayer()
#'
#' Adds individual layer to a myIO widget
#'
#' @export
addIoLayer <- function(myIO,
                     type,
                     color = NULL,
                     label,
                     data = NULL,
                     mapping,
                     options = list(barSize = "large",
                                    toolTipOptions = list(suppressY = FALSE))) {

  allowed_types <- c("line", "point", "bar", "hexbin", "treemap", "gauge",
                     "donut", "area", "groupedBar", "histogram")

  if (!is.character(type) || length(type) != 1 || is.na(type) || !(type %in% allowed_types)) {
    stop("Unknown layer type '", paste(type, collapse = ", "), "'. Must be one of: ",
         paste(allowed_types, collapse = ", "), ".", call. = FALSE)
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

  required_map <- switch(type,
    treemap = c("level_1", "level_2"),
    gauge = c("value"),
    histogram = c("value"),
    c("x_var", "y_var")
  )
  missing_map <- setdiff(required_map, names(mapping))
  if (length(missing_map) > 0) {
    stop("Missing required mapping: ", paste(missing_map, collapse = ", "), call. = FALSE)
  }

  for (field in intersect(c("x_var", "y_var", "group", "level_1", "level_2", "value"), names(mapping))) {
    if (!mapping[[field]] %in% colnames(data)) {
      stop("Mapping variable '", mapping[[field]], "' not found in data.", call. = FALSE)
    }
  }

  numeric_field <- intersect(c("y_var", "value"), names(mapping))
  if (type %in% c("line", "point", "bar", "hexbin", "area", "groupedBar", "histogram", "gauge", "donut") &&
      length(numeric_field) > 0 &&
      !is.numeric(data[[mapping[[numeric_field[1]]]]])) {
    stop("Mapped field '", mapping[[numeric_field[1]]], "' must be numeric for type '", type, "'.", call. = FALSE)
  }

  presets <- list(barSize = "large", toolTipOptions = list(suppressY = FALSE))
  if (is.null(options)) {
    options <- presets
  }

  standalone_types <- c("treemap", "gauge", "donut")
  current_types <- vapply(existing_layers, function(layer) layer$type, character(1))
  if ((type %in% standalone_types && length(current_types) > 0) ||
      (any(current_types %in% standalone_types) && !(type %in% standalone_types))) {
    stop("Cannot mix standalone layer types with other layers.", call. = FALSE)
  }

  if (length(grep("group", names(mapping))) == 0) {
    if (type == "treemap") {
      data <- build_tree(data, label, mapping$level_1, mapping$level_2)
    } else {
      data <- unname(split(data, seq_len(nrow(data))))
    }

    layer <- list(type = type, color = color, label = label, data = data, mapping = mapping, options = options)
    myIO$x$config$layers <- c(myIO$x$config$layers, list(layer))
  } else {
    groupList <- unique(data[[mapping$group]])
    if (is.null(color)) {
      color <- c("#1E90FF", "#DC143C", "#336292", "#070A41", "orange")
      color <- color[seq_along(groupList)]
    } else {
      color <- color[seq_along(groupList)]
    }
    newLayers <- lapply(groupList, buildLayers,
      group = mapping$group,
      grouping = groupList,
      color = color,
      data = data,
      type = type,
      mapping = mapping,
      options = options
    )
    myIO$x$config$layers <- c(myIO$x$config$layers, newLayers)
  }

  myIO
}
