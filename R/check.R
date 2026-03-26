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
