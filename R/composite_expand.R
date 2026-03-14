#' Expand a composite layer into sub-layers
#'
#' @keywords internal
expandComposite <- function(type, label, data, mapping, options, color, existing_layers) {
  composite <- composite_registry()[[type]]
  if (is.null(composite)) {
    stop("Unknown composite type '", type, "'.", call. = FALSE)
  }

  components <- composite$components %||% list()
  parent_id <- next_layer_id(existing_layers)

  lapply(seq_along(components), function(index) {
    component <- components[[index]]
    transform_name <- component$transform %||% "identity"
    transform_fn <- get_transform(transform_name)
    transformed <- transform_fn(data, mapping, component$options %||% options)

    list(
      id = sprintf("%s_sub_%02d", parent_id, index),
      type = component$type,
      color = component$color %||% color,
      label = component$label %||% label,
      data = as_layer_rows(transformed$data),
      mapping = component$mapping %||% mapping,
      options = component$options %||% options,
      transform = transform_name,
      transformMeta = transformed$meta,
      encoding = list(),
      sourceKey = "_source_key",
      derivedFrom = parent_id,
      order = index,
      visibility = TRUE,
      `_composite` = label,
      `_compositeRole` = component$role %||% paste0("component_", index)
    )
  })
}
