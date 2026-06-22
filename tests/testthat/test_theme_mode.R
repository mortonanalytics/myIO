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

test_that("setTheme mode error is fn-prefixed and lists valid choices", {
  expect_error(setTheme(myIO(), mode = "neon"),
               'setTheme\\(\\): `mode` must be "light", "dark", "auto"')
})

# --- E5: warn on unknown (non `--`) dots, with did-you-mean ---

test_that("setTheme warns on a typo'd theme arg instead of silently dropping it", {
  expect_warning(setTheme(myIO(), text_colour = "#222"),
                 "ignoring unknown argument")
  expect_warning(setTheme(myIO(), text_colour = "#222"),
                 "Did you mean `text_color`")
})

test_that("setTheme does not warn for valid -- prefixed overrides via dots", {
  expect_warning(setTheme(myIO(), "--chart-ref-line-color" = "yellow"), NA)
})

test_that("setTheme still applies valid -- overrides even when an unknown arg is present", {
  w <- suppressWarnings(
    setTheme(myIO(), "--chart-ref-line-color" = "yellow", bogus = 1)
  )
  expect_equal(w$x$config$theme$values[["--chart-ref-line-color"]], "yellow")
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
