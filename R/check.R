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

# Resolve a camelCase argument that has a deprecated snake_case alias. The
# camelCase form is canonical (matches colorScheme/xAxis/xRef etc.); the
# snake_case form keeps working but warns. Both default to NULL in the caller,
# which then coalesces the result to the real default. Precedence: if both are
# supplied the camelCase value wins. Returns NULL when neither is supplied.
deprecated_alias <- function(new_val, old_val, new_name, old_name, fn_name) {
  if (!is.null(old_val)) {
    warning(fn_name, "(): argument `", old_name, "` is deprecated; use `",
            new_name, "` instead.", call. = FALSE)
    if (is.null(new_val)) {
      return(old_val)
    }
  }
  new_val
}
