#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  if (!requireNamespace("devtools", quietly = TRUE)) {
    stop("tools/dump-r-contracts.R requires devtools.", call. = FALSE)
  }
  if (!requireNamespace("jsonlite", quietly = TRUE)) {
    stop("tools/dump-r-contracts.R requires jsonlite.", call. = FALSE)
  }
})

devtools::load_all(".", quiet = TRUE)

ns <- asNamespace("myIO")

exported_functions <- sort(getNamespaceExports(ns))
function_signatures <- list()
for (fn in exported_functions) {
  obj <- getExportedValue("myIO", fn)
  if (is.function(obj)) {
    args <- names(formals(obj))
    if (is.null(args)) args <- character(0)
    function_signatures[[fn]] <- args
  }
}

required_mapping_for_type <- function(type) {
  switch(type,
    treemap = c("level_1", "level_2"),
    gauge = c("value"),
    histogram = c("value"),
    heatmap = c("x_var", "y_var", "value"),
    candlestick = c("x_var", "open", "high", "low", "close"),
    waterfall = c("x_var", "y_var"),
    sankey = c("source", "target", "value"),
    boxplot = c("x_var", "y_var"),
    violin = c("x_var", "y_var"),
    qq = c("y_var"),
    ridgeline = c("x_var", "y_var", "group"),
    rangeBar = c("x_var", "low_y", "high_y"),
    area = c("x_var", "low_y", "high_y"),
    hexbin = c("x_var", "y_var", "radius"),
    survfit = c("time", "status"),
    histogram_fit = c("value"),
    dumbbell = c("x_var", "low_y", "high_y"),
    waffle = c("category", "value"),
    bump = c("x_var", "y_var", "group"),
    radar = c("axis", "value"),
    funnel = c("stage", "value"),
    parallel = c("dimensions"),
    calendarHeatmap = c("date", "value"),
    quantile_dots = c("x_var", "y_var"),
    fan = c("x_var", "y_var"),
    c("x_var", "y_var")
  )
}

numeric_fields_for_type <- function(type) {
  fields <- switch(type,
    line = c("x_var", "y_var"),
    point = c("x_var", "y_var"),
    bar = c("y_var"),
    groupedBar = c("y_var"),
    hexbin = c("x_var", "y_var", "radius"),
    area = c("x_var", "low_y", "high_y"),
    histogram = c("value"),
    gauge = c("value"),
    donut = c("y_var"),
    heatmap = c("value"),
    candlestick = c("open", "high", "low", "close"),
    waterfall = c("y_var"),
    sankey = c("value"),
    violin = c("y_var"),
    ridgeline = c("x_var"),
    rangeBar = c("low_y", "high_y"),
    survfit = c("time", "status"),
    histogram_fit = c("value"),
    dumbbell = c("low_y", "high_y"),
    waffle = c("value"),
    beeswarm = c("y_var"),
    bump = c("y_var"),
    radar = c("value"),
    funnel = c("value"),
    calendarHeatmap = c("value"),
    quantile_dots = c("y_var"),
    fan = c("y_var"),
    c("y_var")
  )
  intersect(fields, required_mapping_for_type(type))
}

transform_contracts <- get("TRANSFORM_INPUT_CONTRACTS", envir = ns)

payload <- list(
  allowed_types = get("ALLOWED_TYPES", envir = ns),
  valid_combinations = get("VALID_COMBINATIONS", envir = ns),
  transforms = names(get("transform_registry", envir = ns)()),
  composites = names(get("composite_registry", envir = ns)()),
  compatibility_groups = get("COMPATIBILITY_GROUPS", envir = ns),
  required_mappings = stats::setNames(
    lapply(get("ALLOWED_TYPES", envir = ns), required_mapping_for_type),
    get("ALLOWED_TYPES", envir = ns)
  ),
  numeric_fields = stats::setNames(
    lapply(get("ALLOWED_TYPES", envir = ns), numeric_fields_for_type),
    get("ALLOWED_TYPES", envir = ns)
  ),
  transform_input_contracts = transform_contracts,
  function_signatures = function_signatures
)

cat(jsonlite::toJSON(payload, auto_unbox = TRUE, pretty = TRUE, null = "null"))
cat("\n")
