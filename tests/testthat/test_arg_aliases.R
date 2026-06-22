# E1: camelCase argument names are canonical; the prior snake_case names keep
# working as deprecated aliases (additive, backward compatible).

test_that("setBrush: camelCase onSelect works without warning", {
  expect_silent(w <- setBrush(myIO(), onSelect = "export"))
  expect_equal(w$x$config$interactions$brush$onSelect, "export")
  expect_silent(w2 <- setBrush(myIO()))
  expect_equal(w2$x$config$interactions$brush$onSelect, "highlight")
})

test_that("setBrush: snake_case on_select still works but warns", {
  expect_warning(w <- setBrush(myIO(), on_select = "export"), "on_select")
  expect_equal(w$x$config$interactions$brush$onSelect, "export")
})

test_that("setBrush: camelCase wins when both supplied", {
  expect_warning(w <- setBrush(myIO(), onSelect = "export", on_select = "highlight"),
                 "on_select")
  expect_equal(w$x$config$interactions$brush$onSelect, "export")
})

test_that("setFacet: camelCase minWidth/labelPosition work silently", {
  expect_silent(w <- setFacet(myIO(), "g", minWidth = 320, labelPosition = "bottom"))
  expect_equal(w$x$config$facet$minWidth, 320)
  expect_equal(w$x$config$facet$labelPosition, "bottom")
  # defaults preserved
  w2 <- setFacet(myIO(), "g")
  expect_equal(w2$x$config$facet$minWidth, 200)
  expect_equal(w2$x$config$facet$labelPosition, "top")
})

test_that("setFacet: snake_case aliases still work but warn", {
  expect_warning(w <- setFacet(myIO(), "g", min_width = 250), "min_width")
  expect_equal(w$x$config$facet$minWidth, 250)
  expect_warning(w2 <- setFacet(myIO(), "g", label_position = "bottom"), "label_position")
  expect_equal(w2$x$config$facet$labelPosition, "bottom")
})

test_that("setFacet: camelCase wins when both forms supplied", {
  expect_warning(w <- setFacet(myIO(), "g", minWidth = 320, min_width = 100), "min_width")
  expect_equal(w$x$config$facet$minWidth, 320)
})

test_that("setFacet: rejects an unknown extra argument", {
  expect_error(setFacet(myIO(), "g", bogus = 1), "bogus")
})

test_that("partial matching of the canonical name still works (no collision)", {
  # `min`/`text` previously could ambiguously match both forms; with the
  # snake_case aliases out of the formals they bind cleanly to the camelCase arg.
  expect_silent(w <- setFacet(myIO(), "g", min = 275))
  expect_equal(w$x$config$facet$minWidth, 275)
  expect_silent(t <- setTheme(myIO(), text = "#abc"))
  expect_equal(t$x$config$theme$values[["--chart-text-color"]], "#abc")
})

test_that("setFacet: validation messages use the canonical name", {
  expect_error(setFacet(myIO(), "g", minWidth = -1), "minWidth")
})

test_that("setTheme: camelCase textColor/gridColor work silently", {
  expect_silent(w <- setTheme(myIO(), textColor = "#222", gridColor = "#ddd"))
  expect_equal(w$x$config$theme$values[["--chart-text-color"]], "#222")
  expect_equal(w$x$config$theme$values[["--chart-grid-color"]], "#ddd")
})

test_that("setTheme: snake_case color args still work but warn", {
  expect_warning(w <- setTheme(myIO(), text_color = "#111"), "text_color")
  expect_equal(w$x$config$theme$values[["--chart-text-color"]], "#111")
})

test_that("setTheme: camelCase wins when both color forms supplied", {
  expect_warning(w <- setTheme(myIO(), textColor = "#222", text_color = "#999"),
                 "text_color")
  expect_equal(w$x$config$theme$values[["--chart-text-color"]], "#222")
})

test_that("setTheme: --prefixed CSS overrides still pass through ...", {
  expect_silent(w <- setTheme(myIO(), `--chart-tooltip-bg` = "#000"))
  expect_equal(w$x$config$theme$values[["--chart-tooltip-bg"]], "#000")
})

test_that("setBigData: camelCase rowkeyCol works; snake_case warns", {
  df <- data.frame(id = 1:3, x = 1:3)
  expect_silent(w <- setBigData(myIO(), df, rowkeyCol = "id"))
  expect_equal(w$x$bigdata$rowkey_col, "id")
  expect_warning(w2 <- setBigData(myIO(), df, rowkey_col = "id"), "rowkey_col")
  expect_equal(w2$x$bigdata$rowkey_col, "id")
})
