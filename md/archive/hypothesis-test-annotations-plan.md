# Hypothesis Test Annotations — Implementation Plan

Design: `docs/hypothesis-test-annotations-design.md`

## Resolved Open Questions

| # | Question | Resolution |
|---|----------|------------|
| 1 | Band scale x-positioning | Use same integer `position_lookup` scheme as `composite_boxplot.R:12-13`. Transform computes positions identically. |
| 2 | Y-domain padding | 8% step (`y_range * 0.08`) is sufficient. Expose `options$step_fraction` (default `0.08`) for user override. |

## Dependency Order

```
Phase 1: R transform (standalone, no dependencies)
    │
Phase 2: JS renderer (standalone, no R dependencies)
    │
Phase 3: R registrations (depends on Phase 1 & 2 existing)
    │
Phase 4: R composite (depends on Phase 3 registrations)
    │
Phase 5: Tests (depends on all phases)
```

---

## Phase 1 — R Transform

**Gate:** `devtools::load_all()` succeeds; `transform_pairwise_test()` callable directly.

### File: `R/transform_pairwise_test.R` (CREATE)

```r
#' Pairwise hypothesis test transform
#'
#' @keywords internal
transform_pairwise_test <- function(data, mapping, options = list()) {
  method      <- if (is.null(options$method))     "t.test"  else options$method
  p_adjust    <- if (is.null(options$p_adjust))   "none"    else options$p_adjust
  paired      <- if (is.null(options$paired))     FALSE     else options$paired
  conf_level  <- if (is.null(options$conf_level)) 0.95      else options$conf_level
  comparisons <- options$comparisons
  step_frac   <- if (is.null(options$step_fraction)) 0.08   else options$step_fraction

  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]

  if (!is.numeric(y_values)) {
    stop("transform_pairwise_test requires numeric y_var.", call. = FALSE)
  }

  groups    <- unique(as.character(x_values))
  positions <- seq_along(groups)
  pos_lookup <- stats::setNames(positions, groups)

  if (length(groups) < 2L) {
    stop("transform_pairwise_test requires at least 2 groups.", call. = FALSE)
  }

  # Build pair list
  if (is.null(comparisons)) {
    pairs <- utils::combn(groups, 2, simplify = FALSE)
  } else {
    pairs <- comparisons
  }

  if (length(pairs) > 15L) {
    warning("More than 15 pairwise comparisons; consider specifying comparisons explicitly.",
            call. = FALSE)
  }

  # Run tests
  results <- lapply(pairs, function(pair) {
    g1_vals <- y_values[as.character(x_values) == pair[1]]
    g2_vals <- y_values[as.character(x_values) == pair[2]]
    g1_vals <- g1_vals[!is.na(g1_vals)]
    g2_vals <- g2_vals[!is.na(g2_vals)]

    if (length(g1_vals) < 2L || length(g2_vals) < 2L) {
      return(list(
        group1 = pair[1], group2 = pair[2],
        p_value = NA_real_, statistic = NA_real_,
        method_name = method
      ))
    }

    test_fn <- match.fun(method)
    test_result <- test_fn(g1_vals, g2_vals, paired = paired, conf.level = conf_level)

    list(
      group1 = pair[1], group2 = pair[2],
      p_value = test_result$p.value,
      statistic = unname(test_result$statistic),
      method_name = test_result$method
    )
  })

  # Adjust p-values
  raw_p <- vapply(results, function(r) r$p_value, numeric(1))
  adj_p <- if (p_adjust == "none") raw_p else stats::p.adjust(raw_p, method = p_adjust)

  # Bracket stacking: narrowest spans first
  spans <- vapply(results, function(r) {
    abs(pos_lookup[r$group2] - pos_lookup[r$group1])
  }, numeric(1))
  order_idx <- order(spans)

  data_max <- max(y_values, na.rm = TRUE)
  data_min <- min(y_values, na.rm = TRUE)
  y_range  <- data_max - data_min
  step     <- y_range * step_frac

  rows <- vector("list", length(results))
  for (level in seq_along(order_idx)) {
    i <- order_idx[level]
    r <- results[[i]]
    rows[[i]] <- data.frame(
      x1 = unname(pos_lookup[r$group1]),
      x2 = unname(pos_lookup[r$group2]),
      y  = data_max + step * level,
      group1 = r$group1,
      group2 = r$group2,
      p_value = adj_p[i],
      label = format_p_label(adj_p[i]),
      method = r$method_name,
      statistic = r$statistic,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  transformed <- do.call(rbind, rows)

  list(
    data = transformed,
    meta = new_transform_meta("pairwise_test", list(
      sourceKeys = NULL,
      derivedFrom = "input_rows"
    ))
  )
}

#' @keywords internal
format_p_label <- function(p) {
  if (is.na(p))        return("p = NA")
  if (p < 0.001)       return("p < 0.001 ***")
  if (p < 0.01)        return(sprintf("p = %.3f **", p))
  if (p < 0.05)        return(sprintf("p = %.3f *", p))
  sprintf("p = %.2f ns", p)
}
```

**Verification:** `devtools::load_all(); myIO:::transform_pairwise_test(iris, list(x_var = "Species", y_var = "Sepal.Width"))`

---

## Phase 2 — JS BracketRenderer

**Gate:** `npm test` passes; BracketRenderer importable and registered.

### File: `inst/htmlwidgets/myIO/src/renderers/BracketRenderer.js` (CREATE)

```js
import { tagName } from "../utils/responsive.js";

export class BracketRenderer {
  static type = "bracket";
  static traits = {
    hasAxes: true,
    referenceLines: false,
    legendType: "none",
    binning: false,
    rolloverStyle: "none",
    scaleCapabilities: { invertX: false }
  };
  static scaleHints = {
    xScaleType: "linear",
    yScaleType: "linear",
    xExtentFields: [],
    yExtentFields: ["y"],
    domainMerge: "union"
  };
  static dataContract = {
    x1: { required: true, numeric: true },
    x2: { required: true, numeric: true },
    y:  { required: true, numeric: true }
  };

  render(chart, layer) {
    var className = tagName("bracket", chart.element.id, layer.label);
    var tickHeight = 6;
    var labelOffset = 4;
    var transitionSpeed = chart.options.transition.speed;
    var color = layer.color || "var(--text-color, #333)";

    chart.chart.selectAll("." + className).remove();

    var g = chart.chart.append("g")
      .attr("class", className)
      .attr("clip-path", "url(#" + chart.element.id + "clip)");

    layer.data.forEach(function(d) {
      var sx1 = chart.xScale(+d.x1);
      var sx2 = chart.xScale(+d.x2);
      var sy  = chart.yScale(+d.y);

      var bracket = g.append("g").style("opacity", 0);

      // Horizontal line
      bracket.append("line")
        .attr("x1", sx1).attr("y1", sy)
        .attr("x2", sx2).attr("y2", sy)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Left tick
      bracket.append("line")
        .attr("x1", sx1).attr("y1", sy)
        .attr("x2", sx1).attr("y2", sy + tickHeight)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Right tick
      bracket.append("line")
        .attr("x1", sx2).attr("y1", sy)
        .attr("x2", sx2).attr("y2", sy + tickHeight)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // P-value label
      bracket.append("text")
        .attr("x", (sx1 + sx2) / 2)
        .attr("y", sy - labelOffset)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-family", "var(--font-family, sans-serif)")
        .style("fill", color)
        .text(d.label);

      bracket.transition()
        .duration(transitionSpeed)
        .style("opacity", 1);
    });
  }

  formatTooltip() { return null; }

  remove(chart, layer) {
    var className = tagName("bracket", chart.element.id, layer.label);
    chart.chart.selectAll("." + className).remove();
  }
}
```

### File: `inst/htmlwidgets/myIO/src/registry.js` (EDIT)

Add import after line 18 (`TextRenderer` import):

```js
import { BracketRenderer } from "./renderers/BracketRenderer.js";
```

Add registration block after line 100 (TextRenderer registration), before `return`:

```js
  if (!rendererRegistry.has(BracketRenderer.type)) {
    registerRenderer(BracketRenderer.type, new BracketRenderer());
  }
```

**Verification:** `npm test`

---

## Phase 3 — R Registrations

**Gate:** `devtools::check()` passes; `addIoLayer(type = "bracket", transform = "pairwise_test", ...)` works end-to-end.

### File: `R/transform_registry.R` (EDIT)

Add after line 20 (`mean_ci = transform_mean_ci`):

```r
    pairwise_test = transform_pairwise_test
```

### File: `R/util.R` (EDIT — 4 changes)

**1. `ALLOWED_TYPES` (line 28-31):** Add `"bracket"` to the vector:

```r
ALLOWED_TYPES <- c(
  "line", "point", "bar", "hexbin", "treemap", "gauge",
  "donut", "area", "groupedBar", "histogram", "heatmap",
  "candlestick", "waterfall", "sankey", "boxplot", "violin",
  "ridgeline", "rangeBar", "text", "regression", "bracket"
)
```

**2. `COMPATIBILITY_GROUPS` (line 34-55):** Add after `regression`:

```r
  bracket = "axes-continuous"
```

**3. `VALID_COMBINATIONS` (line 69-89):** Add after `text`:

```r
  bracket = c("identity", "pairwise_test")
```

**4. `composite_registry()` (line 91-98):** Add after `regression`:

```r
    comparison = composite_comparison
```

### File: `R/addIoLayer.R` (EDIT)

**`TRANSFORM_INPUT_CONTRACTS` (line 307-318):** Add after `mean_ci` entry:

```r
  pairwise_test = list(
    required_map = c("x_var", "y_var"),
    skip_column_check = c("x1", "x2", "y", "group1", "group2",
                           "p_value", "label", "method", "statistic"),
    auto_mapping = list(x1 = "x1", x2 = "x2", y = "y",
                         label = "label", p_value = "p_value")
  )
```

**Verification:** `devtools::load_all(); devtools::check()`

---

## Phase 4 — R Composite

**Gate:** `composite_comparison` expands correctly; `addIoLayer(type = "comparison", ...)` produces boxplot + bracket sublayers.

### File: `R/composite_comparison.R` (CREATE)

```r
#' Comparison composite expansion
#'
#' @keywords internal
composite_comparison <- function(data, mapping, label, color, options) {
  method      <- if (is.null(options$method))   "t.test" else options$method
  p_adjust    <- if (is.null(options$p_adjust)) "none"   else options$p_adjust
  comparisons <- options$comparisons

  # Reuse boxplot for base layers
  box_layers <- composite_boxplot(data, mapping, label, color, options)

  # Add bracket layer
  bracket_layer <- list(
    type = "bracket",
    role = "significance",
    label = paste0(label, " - significance"),
    data = data,
    mapping = mapping,
    transform = "pairwise_test",
    color = NULL,
    options = list(method = method, p_adjust = p_adjust,
                   comparisons = comparisons),
    scaleHints = list(
      xScaleType = "linear",
      yScaleType = "linear",
      xExtentFields = list(),
      yExtentFields = list("y"),
      domainMerge = "union"
    )
  )

  c(box_layers, list(bracket_layer))
}
```

**Verification:** `devtools::load_all()` then:

```r
myIO(data = iris) |>
  addIoLayer(type = "comparison", label = "test",
             mapping = list(x_var = "Species", y_var = "Sepal.Width"))
```

---

## Phase 5 — Tests

**Gate:** `devtools::test()` and `npm test` both pass.

### File: `tests/testthat/test_transform_pairwise_test.R` (CREATE)

```r
test_that("pairwise_test returns correct columns", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = c(rnorm(10, 5), rnorm(10, 10), rnorm(10, 5)),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expected_cols <- c("x1", "x2", "y", "group1", "group2", "p_value", "label", "method", "statistic")
  expect_true(all(expected_cols %in% colnames(result$data)))
})

test_that("3 groups produce 3 comparisons", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = rnorm(30),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_equal(nrow(result$data), 3)
})

test_that("clearly different groups have p < 0.05", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 30),
    value = c(rnorm(30, 0, 1), rnorm(30, 10, 1)),
    `_source_key` = paste0("row_", 1:60),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_true(result$data$p_value[1] < 0.05)
  expect_true(grepl("\\*", result$data$label[1]))
})

test_that("identical groups have p near 1", {
  set.seed(42)
  vals <- rnorm(20)
  df <- data.frame(
    group = rep(c("A", "B"), each = 20),
    value = c(vals, vals),
    `_source_key` = paste0("row_", 1:40),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_true(result$data$p_value[1] > 0.9)
  expect_true(grepl("ns", result$data$label[1]))
})

test_that("wilcox.test method works", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 15),
    value = c(rnorm(15, 0), rnorm(15, 5)),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                            options = list(method = "wilcox.test"))
  expect_true(result$data$p_value[1] < 0.05)
  expect_true(grepl("Wilcoxon", result$data$method[1]))
})

test_that("bonferroni adjustment increases p-values", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 20),
    value = c(rnorm(20, 0), rnorm(20, 2), rnorm(20, 4)),
    `_source_key` = paste0("row_", 1:60),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  raw <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  adj <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(p_adjust = "bonferroni"))
  expect_true(all(adj$data$p_value >= raw$data$p_value - 1e-10))
})

test_that("explicit comparisons limits output rows", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = rnorm(30),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                            options = list(comparisons = list(c("A", "C"))))
  expect_equal(nrow(result$data), 1)
  expect_equal(result$data$group1, "A")
  expect_equal(result$data$group2, "C")
})

test_that("errors on fewer than 2 groups", {
  df <- data.frame(
    group = rep("A", 10), value = rnorm(10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "at least 2"
  )
})

test_that("errors on non-numeric y_var", {
  df <- data.frame(
    group = rep(c("A", "B"), each = 5),
    value = rep("text", 10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "numeric"
  )
})

test_that("bracket heights are monotonically increasing", {
  df <- data.frame(
    group = rep(c("A", "B", "C", "D"), each = 10),
    value = rnorm(40),
    `_source_key` = paste0("row_", 1:40),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  # All bracket y values should be above data max
  expect_true(all(result$data$y > max(df$value)))
  # Sorted by y should have unique values
  expect_equal(length(unique(result$data$y)), nrow(result$data))
})

test_that("metadata has correct name", {
  df <- data.frame(
    group = rep(c("A", "B"), each = 10), value = rnorm(20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$meta$name, "pairwise_test")
  expect_equal(result$meta$derivedFrom, "input_rows")
})

test_that("warns on > 15 comparisons", {
  df <- data.frame(
    group = rep(paste0("G", 1:7), each = 5),
    value = rnorm(35),
    `_source_key` = paste0("row_", 1:35),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  # 7 groups = 21 pairs
  expect_warning(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "15"
  )
})

test_that("step_fraction option changes bracket spacing", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 10), value = rnorm(20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  r1 <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(step_fraction = 0.08))
  r2 <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(step_fraction = 0.15))
  expect_true(r2$data$y[1] > r1$data$y[1])
})
```

### File: `tests/testthat/test_composite_comparison.R` (CREATE)

```r
test_that("comparison expands to boxplot layers + bracket", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )
  layers <- w$x$config$layers
  # 4 boxplot layers + 1 bracket = 5
  expect_equal(length(layers), 5)
  bracket_layers <- Filter(function(l) l$type == "bracket", layers)
  expect_equal(length(bracket_layers), 1)
  expect_equal(bracket_layers[[1]]$`_compositeRole`, "significance")
})

test_that("comparison passes method and p_adjust to bracket layer", {
  df <- data.frame(
    group = rep(c("A", "B"), each = 5),
    value = rnorm(10),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(method = "wilcox.test", p_adjust = "holm", showOutliers = FALSE)
  )
  layers <- w$x$config$layers
  bracket <- Filter(function(l) l$type == "bracket", layers)[[1]]
  expect_equal(bracket$transform, "pairwise_test")
})

test_that("comparison works with 3 groups", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 8),
    value = c(rnorm(8, 1), rnorm(8, 5), rnorm(8, 10)),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )
  layers <- w$x$config$layers
  bracket <- Filter(function(l) l$type == "bracket", layers)[[1]]
  # 3 groups = 3 pairwise comparisons
  expect_equal(nrow(do.call(rbind, lapply(bracket$data, as.data.frame))), 3)
})
```

### File: `tests/js/bracket-renderer.test.js` (CREATE)

```js
import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

describe("BracketRenderer", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("is registered with type 'bracket'", function() {
    var renderer = getRenderer("bracket");
    expect(renderer).toBeDefined();
    expect(renderer.constructor.type).toBe("bracket");
  });

  test("has correct traits", function() {
    var traits = getRenderer("bracket").constructor.traits;
    expect(traits.hasAxes).toBe(true);
    expect(traits.legendType).toBe("none");
    expect(traits.rolloverStyle).toBe("none");
  });

  test("has correct scaleHints", function() {
    var hints = getRenderer("bracket").constructor.scaleHints;
    expect(hints.yExtentFields).toEqual(["y"]);
    expect(hints.xExtentFields).toEqual([]);
  });

  test("has correct dataContract", function() {
    var contract = getRenderer("bracket").constructor.dataContract;
    expect(contract.x1.required).toBe(true);
    expect(contract.x2.required).toBe(true);
    expect(contract.y.required).toBe(true);
  });

  test("formatTooltip returns null", function() {
    expect(getRenderer("bracket").formatTooltip()).toBeNull();
  });

  test("render creates bracket elements", function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var renderer = getRenderer("bracket");
    var chart = {
      element: el,
      chart: d3.select(el).select(".myIO-chart-area"),
      options: { transition: { speed: 0 } },
      xScale: d3.scaleLinear().domain([0, 4]).range([0, 200]),
      yScale: d3.scaleLinear().domain([0, 20]).range([200, 0])
    };
    var layer = {
      label: "test-brackets",
      color: "#333",
      data: [
        { x1: 1, x2: 2, y: 15, label: "p = 0.03 *" }
      ]
    };

    renderer.render(chart, layer);

    var lines = document.querySelectorAll("line");
    expect(lines.length).toBe(3); // horizontal + 2 ticks
    var texts = document.querySelectorAll("text");
    expect(texts.length).toBe(1);
    expect(texts[0].textContent).toBe("p = 0.03 *");
  });

  test("remove cleans up DOM", function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var renderer = getRenderer("bracket");
    var chart = {
      element: el,
      chart: d3.select(el).select(".myIO-chart-area"),
      options: { transition: { speed: 0 } },
      xScale: d3.scaleLinear().domain([0, 4]).range([0, 200]),
      yScale: d3.scaleLinear().domain([0, 20]).range([200, 0])
    };
    var layer = { label: "test-brackets", color: "#333",
      data: [{ x1: 1, x2: 2, y: 15, label: "p = 0.03 *" }] };

    renderer.render(chart, layer);
    renderer.remove(chart, layer);

    var remaining = el.querySelectorAll("line");
    expect(remaining.length).toBe(0);
  });
});
```

### File: `tests/js/renderers.test.js` (EDIT)

Update the renderer count test (line 48-49) to include `bracket` and `rangeBar` and `text`:

- Line 49: Add `"rangeBar", "text", "bracket"` to the types array
- Line 48: Update count comment to match

**Verification:**

```bash
Rscript -e 'devtools::test()'
npm test
```

---

## File Inventory

| File | Action | Phase |
|------|--------|-------|
| `R/transform_pairwise_test.R` | CREATE | 1 |
| `inst/htmlwidgets/myIO/src/renderers/BracketRenderer.js` | CREATE | 2 |
| `inst/htmlwidgets/myIO/src/registry.js` | EDIT: add import + registration | 2 |
| `R/transform_registry.R` | EDIT: add `pairwise_test` entry | 3 |
| `R/util.R` | EDIT: 4 additions (ALLOWED_TYPES, COMPATIBILITY_GROUPS, VALID_COMBINATIONS, composite_registry) | 3 |
| `R/addIoLayer.R` | EDIT: add TRANSFORM_INPUT_CONTRACTS entry | 3 |
| `R/composite_comparison.R` | CREATE | 4 |
| `tests/testthat/test_transform_pairwise_test.R` | CREATE | 5 |
| `tests/testthat/test_composite_comparison.R` | CREATE | 5 |
| `tests/js/bracket-renderer.test.js` | CREATE | 5 |
| `tests/js/renderers.test.js` | EDIT: update renderer type list | 5 |

**New dependencies:** None. Uses `stats::t.test`, `stats::wilcox.test`, `stats::p.adjust`, `utils::combn` — all base R.

**Total files:** 4 created, 4 edited.
