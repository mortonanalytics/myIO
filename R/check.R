# Internal argument checking helpers.
# Consistent error messages: "fn(): `arg` must be X, not Y."

check_string <- function(x, arg_name, fn_name) {
  if (!is.character(x) || length(x) != 1 || is.na(x)) {
    stop(fn_name, "(): `", arg_name, "` must be a single character string, not ",
         if (is.null(x)) "NULL"
         else if (length(x) != 1) paste0(class(x)[1], " of length ", length(x))
         else paste0(class(x)[1], " (", deparse1(x), ")"),
         ".", call. = FALSE)
  }
}

check_number <- function(x, arg_name, fn_name) {
  if (!is.numeric(x) || length(x) != 1 || is.na(x)) {
    stop(fn_name, "(): `", arg_name, "` must be a single number, not ",
         if (is.null(x)) "NULL"
         else if (length(x) != 1) paste0(class(x)[1], " of length ", length(x))
         else paste0(class(x)[1], " (", deparse1(x), ")"),
         ".", call. = FALSE)
  }
}

check_flag <- function(x, arg_name, fn_name) {
  if (!is.logical(x) || length(x) != 1 || is.na(x)) {
    stop(fn_name, "(): `", arg_name, "` must be TRUE or FALSE, not ",
         if (is.null(x)) "NULL" else paste0(class(x)[1], " (", deparse1(x), ")"),
         ".", call. = FALSE)
  }
}

check_choice <- function(x, choices, arg_name, fn_name) {
  if (length(x) != 1 || is.na(x) || !x %in% choices) {
    stop(fn_name, '(): `', arg_name, '` must be ',
         paste0('"', choices, '"', collapse = ", "),
         ', not "', x, '".', call. = FALSE)
  }
}

check_class <- function(x, cls, arg_name, fn_name) {
  if (!inherits(x, cls)) {
    stop(fn_name, "(): `", arg_name, "` must be a ", cls, " object, not ",
         paste(class(x), collapse = "/"), ".", call. = FALSE)
  }
}

# Emit the standard deprecation signal for a renamed argument. camelCase is the
# canonical form (matches colorScheme/xAxis/xRef etc.); the snake_case form is
# the deprecated alias. Uses .Deprecated() so the signal carries the
# `deprecatedWarning` condition class that tooling keys on.
deprecate_arg <- function(old_name, new_name, fn_name) {
  .Deprecated(
    msg = paste0(fn_name, "(): argument `", old_name,
                 "` is deprecated; use `", new_name, "` instead.")
  )
}

# Resolve deprecated snake_case aliases passed through `...` for setters whose
# `...` carries ONLY those aliases (setBrush, setFacet). The deprecated names are
# kept OUT of the formal list so they cannot prefix-collide with their camelCase
# counterparts under R partial matching (e.g. `min` matching both `minWidth` and
# `min_width`). `aliases` maps new_name -> old_name. Warns once per supplied
# alias and errors on any other dot name, preserving the prior strict rejection
# of unknown arguments. Returns a named list of the supplied alias values.
resolve_dot_aliases <- function(dots, aliases, fn_name) {
  out <- list()
  for (new_name in names(aliases)) {
    old_name <- aliases[[new_name]]
    if (!is.null(dots[[old_name]])) {
      deprecate_arg(old_name, new_name, fn_name)
      out[[new_name]] <- dots[[old_name]]
    }
  }
  unknown <- setdiff(names(dots), unname(aliases))
  if (length(unknown) > 0) {
    stop(fn_name, "(): unused argument(s) ",
         paste0("`", unknown, "`", collapse = ", "), ".", call. = FALSE)
  }
  out
}
