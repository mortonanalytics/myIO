myio_schema_path <- function() {
  path <- system.file("myio-schema.json", package = "myIO")
  if (!nzchar(path)) {
    path <- file.path("inst", "myio-schema.json")
  }
  path
}

myio_load_schema <- function() {
  jsonlite::fromJSON(myio_schema_path(), simplifyVector = FALSE)
}

myio_levenshtein <- function(value, choices) {
  if (!length(choices)) return(NULL)
  normalized <- tolower(as.character(value %||% ""))
  if (grepl("value", normalized, fixed = TRUE) && "y_var" %in% choices) return("y_var")
  if (grepl("column", normalized, fixed = TRUE) && "x_var" %in% choices) return("x_var")
  if (grepl("group", normalized, fixed = TRUE) && "group" %in% choices) return("group")
  prefix <- choices[startsWith(tolower(choices), normalized)]
  if (length(prefix)) return(prefix[[1]])
  choices[[which.min(utils::adist(as.character(value %||% ""), choices))]]
}

myio_tool_error <- function(code, field, message, suggestion = NULL) {
  result <- list(code = code, field = field, message = message)
  if (!is.null(suggestion) && length(suggestion) == 1L && !is.na(suggestion)) {
    result$suggestion <- suggestion
  }
  result
}

myio_is_numeric_column <- function(kind) {
  normalized <- tolower(paste(kind, collapse = " "))
  any(vapply(c("numeric", "integer", "double", "number", "float", "int", "real"),
             function(token) grepl(token, normalized, fixed = TRUE), logical(1)))
}

myio_normalize_columns <- function(columns) {
  if (is.null(columns)) return(NULL)
  if (is.data.frame(columns)) {
    if (!("name" %in% names(columns))) return(NULL)
    types <- if ("type" %in% names(columns)) as.character(columns$type) else rep("unknown", nrow(columns))
    return(stats::setNames(as.list(types), as.character(columns$name)))
  }
  if (is.character(columns) && is.null(names(columns))) {
    return(stats::setNames(as.list(rep("unknown", length(columns))), columns))
  }
  if (is.atomic(columns) && !is.null(names(columns))) {
    return(as.list(columns))
  }
  if (is.list(columns) && !is.null(names(columns))) {
    return(columns)
  }
  if (is.list(columns)) {
    out <- list()
    for (item in columns) {
      if (is.character(item) && length(item) == 1L) {
        out[[item]] <- "unknown"
      } else if (is.list(item) && !is.null(item$name)) {
        out[[as.character(item$name)]] <- as.character(item$type %||% "unknown")
      }
    }
    return(out)
  }
  NULL
}

myio_allowed_mapping_keys <- function(type_schema) {
  unique(sort(c(
    unlist(type_schema$required_mappings, use.names = FALSE),
    names(type_schema$data_contract %||% list()),
    "group", "label", "low_x", "high_x", "total"
  )))
}

#' List myIO Chart Types for LLM Tool Calling
#'
#' Returns chart type names from the generated myIO schema.
#'
#' @return A character vector of chart type names.
#' @examples
#' head(myio_list_chart_types())
#' @export
myio_list_chart_types <- function() {
  names(myio_load_schema()$types)
}

#' Get myIO Chart Schema for LLM Tool Calling
#'
#' @param type Optional chart type. When \code{NULL}, returns every type schema.
#' @return A list containing one chart schema or all chart schemas.
#' @examples
#' myio_chart_schema("boxplot")
#' @export
myio_chart_schema <- function(type = NULL) {
  types <- myio_load_schema()$types
  if (is.null(type)) return(types)
  types[[type]]
}

#' Validate a myIO Chart Specification
#'
#' Validates a proposed chart specification against the generated myIO schema.
#'
#' @param spec A list with \code{type}, \code{mapping}, optional
#'   \code{transform}, and optional \code{columns}.
#' @param columns Optional named column type map. When supplied, overrides
#'   \code{spec$columns} and enables missing-column and numeric-column checks.
#' @return A list with \code{valid} and \code{errors}. Errors use stable
#'   machine-readable \code{code} values.
#' @examples
#' myio_validate_spec(list(
#'   type = "boxplot",
#'   mapping = list(column_var = "Species", value_var = "Sepal.Width")
#' ))
#' @export
myio_validate_spec <- function(spec, columns = NULL) {
  schema <- myio_load_schema()
  errors <- list()
  type <- spec$type %||% NULL
  type_schema <- schema$types[[type]]
  if (is.null(type_schema)) {
    return(list(
      valid = FALSE,
      errors = list(myio_tool_error(
        "UNKNOWN_TYPE", "type",
        sprintf("Unknown chart type '%s'.", type %||% ""),
        myio_levenshtein(type %||% "", names(schema$types))
      ))
    ))
  }

  mapping <- spec$mapping %||% list()
  transform <- spec$transform %||% "identity"
  valid_transforms <- unlist(type_schema$valid_transforms, use.names = FALSE)
  if (!(transform %in% valid_transforms)) {
    errors[[length(errors) + 1L]] <- myio_tool_error(
      "INVALID_TRANSFORM", "transform",
      sprintf("Transform '%s' is not valid for chart type '%s'.", transform, type),
      valid_transforms[[1]]
    )
  }

  allowed_keys <- myio_allowed_mapping_keys(type_schema)
  for (field in unlist(type_schema$required_mappings, use.names = FALSE)) {
    if (!(field %in% names(mapping))) {
      errors[[length(errors) + 1L]] <- myio_tool_error(
        "MISSING_MAPPING", field,
        sprintf("Missing required mapping '%s' for chart type '%s'.", field, type)
      )
    }
  }
  mapped_columns <- list()
  for (field in names(mapping)) {
    if (!(field %in% allowed_keys)) {
      errors[[length(errors) + 1L]] <- myio_tool_error(
        "UNKNOWN_MAPPING_KEY", field,
        sprintf("Unknown mapping key '%s' for chart type '%s'.", field, type),
        myio_levenshtein(field, allowed_keys)
      )
    }
    column_name <- mapping[[field]]
    dimensions <- identical(type, "parallel") && identical(field, "dimensions")
    if (dimensions && is.list(column_name) &&
        all(vapply(column_name, function(x) is.character(x) && length(x) == 1L, logical(1)))) {
      column_name <- unlist(column_name, use.names = FALSE)
    }
    if (!is.character(column_name) || !length(column_name) ||
        (!dimensions && length(column_name) != 1L) ||
        anyNA(column_name) || any(!nzchar(trimws(column_name)))) {
      errors[[length(errors) + 1L]] <- myio_tool_error(
        "INVALID_MAPPING", field,
        sprintf("Mapping '%s' must contain nonempty column names.", field)
      )
    } else {
      mapped_columns[[field]] <- column_name
    }
  }

  column_map <- myio_normalize_columns(columns %||% spec$columns %||% NULL)
  if (!is.null(column_map)) {
    for (field in names(mapped_columns)) {
      for (column_name in mapped_columns[[field]]) {
        if (!(column_name %in% names(column_map))) {
          errors[[length(errors) + 1L]] <- myio_tool_error(
            "MISSING_COLUMN", field,
            sprintf("Mapped column '%s' for '%s' is not present in columns.", column_name, field),
            myio_levenshtein(column_name, names(column_map))
          )
        }
      }
    }
    for (field in unlist(type_schema$numeric_fields, use.names = FALSE)) {
      column_name <- mapping[[field]]
      if (is.character(column_name) && length(column_name) == 1L &&
          !is.na(column_name) && nzchar(trimws(column_name)) &&
          column_name %in% names(column_map) &&
          !myio_is_numeric_column(column_map[[column_name]])) {
        errors[[length(errors) + 1L]] <- myio_tool_error(
          "NON_NUMERIC_COLUMN", field,
          sprintf("Mapped column '%s' for '%s' must be numeric.", column_name, field)
        )
      }
    }
  }

  list(valid = length(errors) == 0L, errors = errors)
}

#' List myIO Functions for LLM Tool Calling
#'
#' @return A character vector of exported myIO function names.
#' @examples
#' head(myio_list_functions())
#' @export
myio_list_functions <- function() {
  names(myio_load_schema()$function_signatures)
}

#' Get a myIO Function Signature for LLM Tool Calling
#'
#' @param fn Optional exported function name. When \code{NULL}, returns all
#'   signatures.
#' @return A character vector of argument names or a named list of signatures.
#' @examples
#' myio_function_signature("setAxisFormat")
#' @export
myio_function_signature <- function(fn = NULL) {
  signatures <- myio_load_schema()$function_signatures
  if (is.null(fn)) return(signatures)
  unlist(signatures[[fn]], use.names = FALSE)
}

#' Validate a myIO Function Call
#'
#' @param fn Exported myIO function name.
#' @param args Named list of proposed arguments.
#' @return A list with \code{valid} and \code{errors}. Errors use stable
#'   machine-readable \code{code} values.
#' @examples
#' myio_validate_call("setAxisFormat", list(axis_x = ".0f"))
#' @export
myio_validate_call <- function(fn, args = list()) {
  schema <- myio_load_schema()
  signature <- schema$function_signatures[[fn]]
  if (is.null(signature)) {
    return(list(
      valid = FALSE,
      errors = list(myio_tool_error(
        "UNKNOWN_FUNCTION", "fn",
        sprintf("Unknown function '%s'.", fn %||% ""),
        myio_levenshtein(fn %||% "", names(schema$function_signatures))
      ))
    ))
  }

  errors <- list()
  for (arg in names(args %||% list())) {
    if (!(arg %in% unlist(signature, use.names = FALSE)) && arg != "...") {
      errors[[length(errors) + 1L]] <- myio_tool_error(
        "UNKNOWN_ARGUMENT", arg,
        sprintf("Unknown argument '%s' for function '%s'.", arg, fn),
        myio_levenshtein(arg, unlist(signature, use.names = FALSE))
      )
    }
  }
  list(valid = length(errors) == 0L, errors = errors)
}
