# Contract tests for theme system v1.2 (mode/preset/overrides)
# These define the target API. Should FAIL until implementation lands.

# --- Backward compatibility (must pass NOW) ---

test_that("existing setTheme API still works (flat dict)", {
  w <- setTheme(myIO(), text_color = "red")
  # v1.2 uses nested structure: theme$values
  expect_equal(w$x$config$theme$values[["--chart-text-color"]], "red")
})

test_that("setTheme with all named args stores in values", {
  w <- setTheme(myIO(), text_color = "white", grid_color = "#333",
                bg = "#1a1a2e", font = "monospace")
  expect_equal(w$x$config$theme$values[["--chart-text-color"]], "white")
  expect_equal(w$x$config$theme$values[["--chart-grid-color"]], "#333")
  expect_equal(w$x$config$theme$values[["--chart-bg"]], "#1a1a2e")
  expect_equal(w$x$config$theme$values[["--chart-font"]], "monospace")
})

test_that("setTheme with ... args get chart- prefix and -- prefix", {
  w <- setTheme(myIO(), "--chart-ref-line-color" = "yellow")
  expect_equal(w$x$config$theme$values[["--chart-ref-line-color"]], "yellow")
})

# --- New mode parameter ---

test_that("setTheme mode parameter works", {
  w <- setTheme(myIO(), mode = "dark")
  expect_equal(w$x$config$theme$mode, "dark")
})

test_that("setTheme auto mode", {
  w <- setTheme(myIO(), mode = "auto")
  expect_equal(w$x$config$theme$mode, "auto")
})

test_that("setTheme light mode", {
  w <- setTheme(myIO(), mode = "light")
  expect_equal(w$x$config$theme$mode, "light")
})

test_that("setTheme rejects invalid mode", {
  expect_error(setTheme(myIO(), mode = "neon"), "mode")
})

test_that("mode defaults to NULL when not specified", {
  w <- setTheme(myIO(), bg = "#fff")
  expect_null(w$x$config$theme$mode)
})

# --- Overrides parameter ---

test_that("setTheme overrides list works", {
  w <- setTheme(myIO(), overrides = list("--chart-tooltip-bg" = "#222"))
  expect_equal(w$x$config$theme$values[["--chart-tooltip-bg"]], "#222")
})

test_that("mode + named args combine", {
  w <- setTheme(myIO(), mode = "dark", bg = "#000")
  expect_equal(w$x$config$theme$mode, "dark")
  expect_equal(w$x$config$theme$values[["--chart-bg"]], "#000")
})

# --- Nested config structure ---

test_that("theme config has nested structure with mode/preset/values", {
  w <- setTheme(myIO(), mode = "dark", bg = "#111")
  expect_true("mode" %in% names(w$x$config$theme))
  expect_true("values" %in% names(w$x$config$theme))
  # preset is optional
})

test_that("empty setTheme produces valid nested structure", {
  w <- setTheme(myIO())
  expect_true(is.list(w$x$config$theme))
  expect_null(w$x$config$theme$mode)
})
