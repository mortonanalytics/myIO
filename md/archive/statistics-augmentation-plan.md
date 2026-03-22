# Implementation Plan: Statistics Augmentation

Design doc: `docs/statistics-augmentation-design.md`
Contract: `md/design/statistics-augmentation-contract.md`

## Blocker Resolutions

Three blockers identified in quality review; each resolved before phasing:

**B1+B2: Validation incompatible with transform-produced columns.**
`validate_layer_inputs` (addIoLayer.R:175-228) checks that mapped fields exist as columns in the user's *input* data. Transforms like `ci` and `mean_ci` produce `low_y`/`high_y` columns that don't exist in input data. Fix: add a `TRANSFORM_INPUT_CONTRACTS` map that overrides `required_map` and skips column-existence checks for transform-produced fields. Auto-injection of `low_y`/`high_y` into mapping happens AFTER validation, BEFORE transform execution.

**B3: TextRenderer pollutes scale computation.**
`processScales` (scales.js) iterates all layers without filtering by `hasAxes`. A text layer with no `x_var`/`y_var` mapping produces `NaN` in extent arrays, breaking `d3.extent`. Fix: filter out layers where `renderer.constructor.traits.hasAxes === false` before passing to `processScales`.

## Warning Resolutions

**W4: composite_regression must split by group.** Add group iteration loop (see Phase 4).
**W5-W8: Edge cases.** Each transform validates minimum data requirements and returns empty data frame + warning on degenerate input (see per-transform specs).
**W9: LineRenderer shows points on fitted curves.** Change condition from `layer.transform !== "lm"` to check against a list of fitting transforms.

---

## Phase 1: Foundation transforms (no JS changes)

Gate: `devtools::test()` passes, `R CMD check` clean.

### 1a. `transform_mean` — Group mean

**Create** `R/transform_mean.R`:

```r
transform_mean <- function(data, mapping, options = list()) {
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(group_value) {
    group_y <- y_values[x_values == group_value]
    group_y <- group_y[!is.na(group_y)]
    data.frame(
      x = group_value,
      y = if (length(group_y) == 0L) NA_real_ else mean(group_y),
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("mean", list(
      sourceKeys = source_keys, derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_mean.R`:
- "computes correct group means"
- "handles NA values with na.rm"
- "returns NA for empty group"
- "single group returns that group's mean"
- "mean matches median for symmetric data"

### 1b. `transform_summary` — General aggregation

**Create** `R/transform_summary.R`:

```r
transform_summary <- function(data, mapping, options = list()) {
  stat <- options$stat %||% "count"
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  stat_fn <- switch(stat,
    count = function(y) length(y[!is.na(y)]),
    sum   = function(y) sum(y, na.rm = TRUE),
    sd    = function(y) stats::sd(y, na.rm = TRUE),
    var   = function(y) stats::var(y, na.rm = TRUE),
    min   = function(y) min(y, na.rm = TRUE),
    max   = function(y) max(y, na.rm = TRUE),
    stop("Unknown stat '", stat, "'. Must be one of: count, sum, sd, var, min, max.", call. = FALSE)
  )

  summarize_group <- function(gv) {
    group_y <- y_values[x_values == gv]
    data.frame(x = gv, y = stat_fn(group_y),
               stringsAsFactors = FALSE, check.names = FALSE)
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("summary", list(
      sourceKeys = source_keys, derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_summary.R`:
- "count returns number of non-NA values per group"
- "sum returns correct totals"
- "sd returns correct standard deviation"
- "unknown stat errors with clear message"
- "handles all-NA group"

### 1c. Update registry and validation

**Edit** `R/transform_registry.R` — add `mean = transform_mean, summary = transform_summary` to registry.

**Edit** `R/util.R`:
- `VALID_COMBINATIONS$point`: add `"mean"`, `"summary"`
- `VALID_COMBINATIONS$bar`: add `"mean"`, `"summary"`

### 1d. Verification

```
devtools::test()
R CMD check --no-manual
```

---

## Phase 2: Regression transforms

Gate: `devtools::test()` passes. Manual visual check: LOESS line on scatter plot.

### 2a. `transform_loess` — LOESS smoothing

**Create** `R/transform_loess.R`:

```r
transform_loess <- function(data, mapping, options = list()) {
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  if (length(x_clean) < 4L) {
    warning("transform_loess requires at least 4 data points; returning empty.", call. = FALSE)
    empty <- data.frame(x = numeric(0), y = numeric(0), `_source_key` = character(0),
                        stringsAsFactors = FALSE, check.names = FALSE)
    colnames(empty)[1:2] <- c(mapping$x_var, mapping$y_var)
    return(list(data = empty, meta = new_transform_meta("loess",
      list(sourceKeys = list(), derivedFrom = "input_rows"))))
  }

  span <- options$span %||% 0.75
  degree <- options$degree %||% 2L
  n_grid <- options$n_grid %||% 100L

  model <- stats::loess(y_clean ~ x_clean, span = span, degree = degree)
  grid_x <- seq(min(x_clean), max(x_clean), length.out = n_grid)
  fitted_y <- stats::predict(model, newdata = data.frame(x_clean = grid_x))

  transformed <- data.frame(
    x = grid_x, y = fitted_y,
    `_source_key` = sprintf("grid_%d", seq_len(n_grid)),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("loess", list(
      sourceKeys = as.list(as.character(data[["_source_key"]][complete])),
      derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_loess.R`:
- "returns smoothed fitted values"
- "respects span option"
- "smaller span produces more wiggly fit"
- "warns and returns empty with < 4 points"
- "handles NA values in input"

### 2b. `transform_polynomial` — Polynomial regression

**Create** `R/transform_polynomial.R`:

```r
transform_polynomial <- function(data, mapping, options = list()) {
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  degree <- options$degree %||% 2L
  n_grid <- options$n_grid %||% 100L

  if (length(x_clean) <= degree) {
    warning("transform_polynomial requires more data points than degree; returning empty.", call. = FALSE)
    empty <- data.frame(x = numeric(0), y = numeric(0), `_source_key` = character(0),
                        stringsAsFactors = FALSE, check.names = FALSE)
    colnames(empty)[1:2] <- c(mapping$x_var, mapping$y_var)
    return(list(data = empty, meta = new_transform_meta("polynomial",
      list(sourceKeys = list(), derivedFrom = "input_rows"))))
  }

  model <- stats::lm(y_clean ~ stats::poly(x_clean, degree = degree, raw = TRUE))
  grid_x <- seq(min(x_clean), max(x_clean), length.out = n_grid)
  fitted_y <- stats::predict(model, newdata = data.frame(x_clean = grid_x))

  transformed <- data.frame(
    x = grid_x, y = fitted_y,
    `_source_key` = sprintf("grid_%d", seq_len(n_grid)),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("polynomial", list(
      sourceKeys = as.list(as.character(data[["_source_key"]][complete])),
      derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_polynomial.R`:
- "degree 2 fits quadratic data better than lm"
- "warns and returns empty when degree >= n"
- "respects n_grid option"
- "passes through _source_key metadata"

### 2c. `transform_smooth` — SMA + EMA

**Create** `R/transform_smooth.R`:

```r
transform_smooth <- function(data, mapping, options = list()) {
  method <- options$method %||% "sma"
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]

  # Sort by x
  ord <- order(x_vals)
  x_sorted <- x_vals[ord]
  y_sorted <- y_vals[ord]
  keys_sorted <- as.character(data[["_source_key"]][ord])

  if (method == "sma") {
    window <- options$window %||% 7L
    if (window > length(y_sorted)) {
      warning("transform_smooth window (", window, ") exceeds data length (",
              length(y_sorted), "); clamping.", call. = FALSE)
      window <- length(y_sorted)
    }
    smoothed <- stats::filter(y_sorted, rep(1 / window, window), sides = 2)
    keep <- !is.na(smoothed)
    transformed <- data.frame(
      x = x_sorted[keep], y = as.numeric(smoothed[keep]),
      `_source_key` = keys_sorted[keep],
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else if (method == "ema") {
    alpha <- options$alpha %||% 0.3
    ema <- numeric(length(y_sorted))
    ema[1] <- y_sorted[1]
    for (i in seq(2, length(y_sorted))) {
      ema[i] <- alpha * y_sorted[i] + (1 - alpha) * ema[i - 1]
    }
    transformed <- data.frame(
      x = x_sorted, y = ema,
      `_source_key` = keys_sorted,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else {
    stop("Unknown smooth method '", method, "'. Must be 'sma' or 'ema'.", call. = FALSE)
  }

  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("smooth", list(
      sourceKeys = as.list(transformed[["_source_key"]]),
      derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_smooth.R`:
- "SMA with window=3 averages correctly"
- "EMA with alpha=1 returns raw data"
- "EMA with alpha=0 returns constant (first value)"
- "SMA warns and clamps when window > nrow"
- "unknown method errors"
- "data is sorted by x before smoothing"

### 2d. `transform_residuals` — Regression diagnostics

**Create** `R/transform_residuals.R`:

```r
transform_residuals <- function(data, mapping, options = list()) {
  method <- options$method %||% "lm"
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  model <- switch(method,
    lm = stats::lm(y_clean ~ x_clean),
    loess = stats::loess(y_clean ~ x_clean, span = options$span %||% 0.75),
    polynomial = stats::lm(y_clean ~ stats::poly(x_clean, degree = options$degree %||% 2L, raw = TRUE)),
    stop("Unknown residuals method '", method, "'.", call. = FALSE)
  )

  resid_vals <- stats::residuals(model)
  fitted_vals <- stats::fitted(model)

  transformed <- data.frame(
    x = fitted_vals, y = resid_vals,
    `_source_key` = as.character(data[["_source_key"]][complete]),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("residuals", list(
      sourceKeys = as.list(transformed[["_source_key"]]),
      derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_residuals.R`:
- "lm residuals sum to approximately zero"
- "residuals have same length as complete cases"
- "loess method works"
- "polynomial method works"
- "x values are fitted values (not original x)"

### 2e. Update registry and validation

**Edit** `R/transform_registry.R` — add `loess`, `polynomial`, `smooth`, `residuals`.

**Edit** `R/util.R`:
- `VALID_COMBINATIONS$line`: add `"loess"`, `"polynomial"`, `"smooth"`
- `VALID_COMBINATIONS$point`: add `"residuals"`

### 2f. Verification

```
devtools::test()
R CMD check --no-manual
```

Manual test: build bundle, create scatter + LOESS line in Shiny app, visually confirm smooth curve.

---

## Phase 3: CI and mean_ci transforms + validation fix (BLOCKER resolution)

Gate: `devtools::test()` passes. CI band renders visually over scatter + trend line.

### 3a. Validation refactor (BLOCKER B1+B2)

**Edit** `R/addIoLayer.R`:

Add a `TRANSFORM_INPUT_CONTRACTS` map after line 30 that defines what the *user* must provide (vs. what the transform produces):

```r
TRANSFORM_INPUT_CONTRACTS <- list(
  ci = list(
    required_map = c("x_var", "y_var"),
    skip_column_check = c("low_y", "high_y"),
    auto_mapping = list(low_y = "low_y", high_y = "high_y")
  ),
  mean_ci = list(
    required_map = c("x_var", "y_var"),
    skip_column_check = c("low_y", "high_y"),
    auto_mapping = list(low_y = "low_y", high_y = "high_y")
  )
)
```

**Edit** `R/addIoLayer.R` `validate_layer_inputs` (line 175-228):

After computing `required_map` at line 175-190, add:

```r
# Override required_map for transforms that change the output shape
input_contract <- TRANSFORM_INPUT_CONTRACTS[[transform]]
if (!is.null(input_contract)) {
  required_map <- input_contract$required_map
}
```

In the column-existence check (lines 196-201), skip fields listed in `skip_column_check`:

```r
skip_fields <- if (!is.null(input_contract)) input_contract$skip_column_check else character(0)
mapped_fields <- setdiff(mapped_fields, skip_fields)
```

In the numeric check (lines 203-210), also skip `skip_column_check` fields.

**Edit** `R/addIoLayer.R` — add auto-mapping injection after validation (after line 40, before transform execution):

```r
# Auto-inject transform output mapping (per Decision #11)
input_contract <- TRANSFORM_INPUT_CONTRACTS[[transform]]
if (!is.null(input_contract) && !is.null(input_contract$auto_mapping)) {
  for (field in names(input_contract$auto_mapping)) {
    if (is.null(mapping[[field]])) {
      mapping[[field]] <- input_contract$auto_mapping[[field]]
    }
  }
}
```

**Create** `tests/testthat/test_transform_input_contracts.R`:
- "ci transform accepts x_var + y_var mapping (no low_y/high_y required)"
- "mean_ci transform accepts x_var + y_var mapping"
- "auto-injects low_y and high_y into mapping"
- "user-provided low_y/high_y are not overwritten"
- "validation still rejects missing x_var"

### 3b. `transform_ci` — Confidence / Prediction interval

**Create** `R/transform_ci.R`:

```r
transform_ci <- function(data, mapping, options = list()) {
  method <- options$method %||% "lm"
  level <- options$level %||% 0.95
  interval <- options$interval %||% "confidence"
  n_grid <- options$n_grid %||% 100L
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  if (length(x_clean) < 3L) {
    warning("transform_ci requires at least 3 data points; returning empty.", call. = FALSE)
    empty <- data.frame(x = numeric(0), low_y = numeric(0), high_y = numeric(0),
                        stringsAsFactors = FALSE, check.names = FALSE)
    colnames(empty)[1] <- mapping$x_var
    return(list(data = empty, meta = new_transform_meta("ci",
      list(sourceKeys = list(), derivedFrom = "input_rows"))))
  }

  grid_x <- seq(min(x_clean), max(x_clean), length.out = n_grid)

  if (method == "lm") {
    model <- stats::lm(y_clean ~ x_clean)
    preds <- stats::predict(model,
      newdata = data.frame(x_clean = grid_x),
      interval = interval, level = level)
    transformed <- data.frame(
      x = grid_x, low_y = preds[, "lwr"], high_y = preds[, "upr"],
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else if (method == "loess") {
    span <- options$span %||% 0.75
    model <- stats::loess(y_clean ~ x_clean, span = span)
    preds <- stats::predict(model,
      newdata = data.frame(x_clean = grid_x), se = TRUE)
    alpha <- 1 - level
    df <- model$enp - 1
    t_crit <- stats::qt(1 - alpha / 2, df = max(df, 1))
    transformed <- data.frame(
      x = grid_x,
      low_y = preds$fit - t_crit * preds$se.fit,
      high_y = preds$fit + t_crit * preds$se.fit,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else {
    stop("Unknown ci method '", method, "'. Must be 'lm' or 'loess'.", call. = FALSE)
  }

  colnames(transformed)[1] <- mapping$x_var

  list(
    data = transformed,
    meta = new_transform_meta("ci", list(
      sourceKeys = as.list(as.character(data[["_source_key"]][complete])),
      derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_ci.R`:
- "returns low_y and high_y columns"
- "CI contains fitted line at every grid point"
- "level=0.99 produces wider band than level=0.95"
- "prediction interval is wider than confidence interval"
- "loess method produces smooth bounds"
- "warns and returns empty with < 3 points"
- "respects n_grid option"

### 3c. `transform_mean_ci` — Group mean ± CI

**Create** `R/transform_mean_ci.R`:

```r
transform_mean_ci <- function(data, mapping, options = list()) {
  level <- options$level %||% 0.95
  method <- options$method %||% "t"
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(gv) {
    group_y <- y_values[x_values == gv]
    group_y <- group_y[!is.na(group_y)]
    n <- length(group_y)

    if (n < 2L) {
      return(data.frame(x = gv, y = if (n == 1L) group_y else NA_real_,
        low_y = NA_real_, high_y = NA_real_, n = n, se = NA_real_,
        stringsAsFactors = FALSE, check.names = FALSE))
    }

    m <- mean(group_y)
    se <- stats::sd(group_y) / sqrt(n)
    margin <- if (method == "t") {
      stats::qt(1 - (1 - level) / 2, df = n - 1) * se
    } else {
      stats::qnorm(1 - (1 - level) / 2) * se
    }

    data.frame(x = gv, y = m, low_y = m - margin, high_y = m + margin,
               n = n, se = se,
               stringsAsFactors = FALSE, check.names = FALSE)
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("mean_ci", list(
      sourceKeys = source_keys, derivedFrom = "input_rows"
    ))
  )
}
```

**Create** `tests/testthat/test_transform_mean_ci.R`:
- "bounds contain the mean"
- "level=0.99 is wider than level=0.95"
- "n=1 returns NA bounds"
- "t-method matches stats::t.test output"
- "se-method uses normal approximation"
- "includes n and se columns"

### 3d. Update registry and validation

**Edit** `R/transform_registry.R` — add `ci`, `mean_ci`.

**Edit** `R/util.R`:
- `VALID_COMBINATIONS$area`: add `"ci"`
- `VALID_COMBINATIONS$rangeBar`: add `"mean_ci"`

### 3e. Verification

```
devtools::test()
R CMD check --no-manual
npm run build
devtools::install()
```

Manual test: scatter + lm line + CI band area in Shiny app.

---

## Phase 4: JS changes + composite (BLOCKER B3 + W9 resolution)

Gate: `npm run test` passes. TextRenderer renders R². LineRenderer suppresses points on fitted curves. CI band renders without scale issues.

### 4a. Fix `processScales` to filter non-axes layers (BLOCKER B3)

**Edit** `inst/htmlwidgets/myIO/src/derive/scales.js`:

In `processScales`, before iterating layers, filter out layers whose renderer has `hasAxes: false`:

```js
// At the top of processScales, after receiving lys:
var axesLayers = lys.filter(function(layer) {
  var reg = registry.get(layer.type);
  return !reg || reg.constructor.traits.hasAxes !== false;
});
// Use axesLayers instead of lys for extent computation
```

**Edit** `tests/js/scale-semantics.test.js`:
- "layers with hasAxes: false are excluded from extent computation"

### 4b. Fix LineRenderer point suppression (WARNING W9)

**Edit** `inst/htmlwidgets/myIO/src/renderers/LineRenderer.js` line 52:

```js
// Before:
if (layer.transform !== "lm") {

// After:
var fittingTransforms = ["lm", "loess", "polynomial", "smooth"];
if (fittingTransforms.indexOf(layer.transform) === -1) {
```

**Edit** `tests/js/renderers.test.js`:
- "LineRenderer suppresses points for loess transform"
- "LineRenderer suppresses points for polynomial transform"
- "LineRenderer suppresses points for smooth transform"

### 4c. Create TextRenderer

**Create** `inst/htmlwidgets/myIO/src/renderers/TextRenderer.js`:

```js
import { tagName } from "../utils/responsive.js";

export class TextRenderer {
  static type = "text";
  static traits = {
    hasAxes: false,
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
    yExtentFields: [],
    domainMerge: "union"
  };
  static dataContract = {};

  render(chart, layer) {
    var position = (layer.options && layer.options.position) || "top-right";
    var text = layer.data.map(function(d) { return d.text; }).join("\n");
    var key = layer.label;
    var className = tagName("text-annotation", chart.element.id, key);

    // Remove existing
    chart.chart.selectAll("." + className).remove();

    var margins = { "top-right": { x: -10, y: 10, anchor: "end" },
                    "top-left": { x: 10, y: 10, anchor: "start" },
                    "bottom-right": { x: -10, y: -10, anchor: "end" },
                    "bottom-left": { x: 10, y: -10, anchor: "start" } };
    var m = margins[position] || margins["top-right"];
    var isTop = position.indexOf("top") !== -1;
    var isRight = position.indexOf("right") !== -1;

    var x = isRight ? chart.width : 0;
    var y = isTop ? 0 : chart.height;

    var g = chart.chart.append("g")
      .attr("class", className)
      .attr("transform", "translate(" + (x + m.x) + "," + (y + m.y) + ")");

    var lines = text.split("\n");
    lines.forEach(function(line, i) {
      g.append("text")
        .attr("y", (isTop ? 1 : -1) * i * 16)
        .attr("text-anchor", m.anchor)
        .style("font-size", "12px")
        .style("font-family", "var(--font-family, sans-serif)")
        .style("fill", "var(--text-color, #333)")
        .style("opacity", 0.8)
        .text(line);
    });
  }

  formatTooltip() { return null; }

  remove(chart, layer) {
    var className = tagName("text-annotation", chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll("." + className).remove();
  }
}
```

### 4d. Register TextRenderer

**Edit** `inst/htmlwidgets/myIO/src/registry.js`:

Add import and registration call in `registerBuiltInRenderers()`:

```js
import { TextRenderer } from "./renderers/TextRenderer.js";
// ... in registerBuiltInRenderers():
registerRenderer(new TextRenderer());
```

### 4e. JS tests

**Edit** `tests/js/renderers.test.js`:
- "TextRenderer registers with type 'text'"
- "TextRenderer has hasAxes: false"
- "TextRenderer has empty extent fields"

**Edit** `tests/js/scale-semantics.test.js`:
- "text layer does not affect scale domain"

### 4f. `composite_regression`

**Create** `R/composite_regression.R`:

```r
composite_regression <- function(data, mapping, label, color, options) {
  method <- options$method %||% "lm"
  show_ci <- if (is.null(options$showCI)) TRUE else isTRUE(options$showCI)
  show_stats <- if (is.null(options$showStats)) TRUE else isTRUE(options$showStats)
  level <- options$level %||% 0.95
  interval <- options$interval %||% "confidence"

  # Determine groups
  if (!is.null(mapping$group) && mapping$group %in% colnames(data)) {
    group_vals <- unique(data[[mapping$group]])
  } else {
    group_vals <- list(NULL)  # single group
  }

  sublayers <- list()

  for (gv in group_vals) {
    if (!is.null(gv)) {
      group_data <- data[data[[mapping$group]] == gv, , drop = FALSE]
      group_label <- paste0(label, " \u2014 ", as.character(gv))
    } else {
      group_data <- data
      group_label <- label
    }

    # 1. Scatter points
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "point", role = "scatter",
      label = paste0(group_label, " (data)"),
      data = group_data, mapping = mapping, transform = "identity",
      color = color, options = list()
    )

    # 2. Trend line
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "line", role = "trend",
      label = paste0(group_label, " (trend)"),
      data = group_data, mapping = mapping, transform = method,
      color = color, options = options
    )

    # 3. CI band
    if (show_ci) {
      sublayers[[length(sublayers) + 1L]] <- list(
        type = "area", role = "ci_band",
        label = paste0(group_label, " (CI)"),
        data = group_data,
        mapping = list(x_var = mapping$x_var, y_var = mapping$y_var,
                       low_y = "low_y", high_y = "high_y"),
        transform = "ci",
        color = color,
        options = list(method = method, level = level, interval = interval,
                       span = options$span, degree = options$degree)
      )
    }

    # 4. R² annotation (only for lm/polynomial, first group only)
    if (show_stats && length(sublayers) <= 4 && method %in% c("lm", "polynomial")) {
      x_vals <- group_data[[mapping$x_var]]
      y_vals <- group_data[[mapping$y_var]]
      complete <- !is.na(x_vals) & !is.na(y_vals)
      if (sum(complete) >= 3L) {
        model <- if (method == "lm") {
          stats::lm(y_vals[complete] ~ x_vals[complete])
        } else {
          stats::lm(y_vals[complete] ~ stats::poly(x_vals[complete],
            degree = options$degree %||% 2L, raw = TRUE))
        }
        r_sq <- summary(model)$r.squared
        coefs <- stats::coef(model)
        eq_text <- if (method == "lm") {
          sprintf("y = %s x + %s", format(round(coefs[2], 3), nsmall = 3),
                  format(round(coefs[1], 3), nsmall = 3))
        } else {
          paste0("poly(", options$degree %||% 2L, ")")
        }

        annotation_data <- data.frame(
          text = c(
            paste0("R\u00B2 = ", format(round(r_sq, 3), nsmall = 3)),
            eq_text
          ),
          stringsAsFactors = FALSE
        )

        sublayers[[length(sublayers) + 1L]] <- list(
          type = "text", role = "annotation",
          label = paste0(group_label, " (stats)"),
          data = annotation_data, mapping = list(),
          transform = "identity", color = NULL,
          options = list(position = "top-right")
        )
      }
    }
  }

  sublayers
}
```

### 4g. Update registries

**Edit** `R/util.R`:
- Add `"text"` and `"regression"` to `ALLOWED_TYPES`
- Add `regression = composite_regression` to `composite_registry()`
- Add `text = "axes-continuous"` and `regression = "axes-continuous"` to `COMPATIBILITY_GROUPS`
- Add `text = c("identity")` to `VALID_COMBINATIONS`

### 4h. Composite tests

**Create** `tests/testthat/test_composite_regression.R`:
- "creates 3 sublayers by default (scatter, trend, CI)"
- "creates 4 sublayers with showStats=TRUE"
- "showCI=FALSE produces 2 sublayers"
- "trend sublayer uses specified method"
- "CI sublayer is type area with ci transform"
- "grouped data produces N sets of sublayers"
- "annotation sublayer contains R² text"

### 4i. Build and verify

```
npm run build
npm run test
devtools::install()
devtools::test()
R CMD check --no-manual
```

---

## Phase 5: E2E integration tests + gallery

Gate: Full test suite passes. All new chart types render in gallery app.

### 5a. E2E widget tests

**Edit** `tests/testthat/test_e2e_widgets.R` — add test cases:

```r
test_that("regression composite renders", {
  w <- myIO(data = mtcars) |>
    addIoLayer(type = "regression", label = "mpg vs wt",
      mapping = list(x_var = "wt", y_var = "mpg"))
  html <- htmlwidgets::saveWidget(w, tempfile(fileext = ".html"))
  expect_true(file.exists(html))
})

test_that("scatter + lm + CI band renders", {
  w <- myIO(data = mtcars) |>
    addIoLayer(type = "point", label = "data",
      mapping = list(x_var = "wt", y_var = "mpg")) |>
    addIoLayer(type = "line", label = "trend", transform = "lm",
      mapping = list(x_var = "wt", y_var = "mpg")) |>
    addIoLayer(type = "area", label = "CI", transform = "ci",
      mapping = list(x_var = "wt", y_var = "mpg"))
  expect_equal(length(w$x$config$layers), 3L)
})

test_that("LOESS line renders", { ... })
test_that("mean_ci error bars render", { ... })
test_that("SMA overlay renders", { ... })
test_that("residual plot renders", { ... })
```

### 5b. Gallery app updates

**Edit** the Shiny gallery app to add a "Statistical" tab showcasing:
- Regression composite (scatter + trend + CI + R²)
- Mean ± CI error bars (iris species)
- LOESS smoothing
- Moving average overlay
- Residual diagnostic plot

### 5c. Final verification

```
npm run build
npm run test
devtools::install()
devtools::test()
R CMD check --no-manual
```

---

## File Inventory

### New files (14)

| File | Phase | Description |
|------|-------|-------------|
| `R/transform_mean.R` | 1 | Group mean |
| `R/transform_summary.R` | 1 | General aggregation |
| `R/transform_loess.R` | 2 | LOESS smoothing |
| `R/transform_polynomial.R` | 2 | Polynomial regression |
| `R/transform_smooth.R` | 2 | SMA + EMA |
| `R/transform_residuals.R` | 2 | Regression residuals |
| `R/transform_ci.R` | 3 | Confidence/prediction intervals |
| `R/transform_mean_ci.R` | 3 | Group mean ± CI |
| `R/composite_regression.R` | 4 | Regression composite |
| `inst/htmlwidgets/myIO/src/renderers/TextRenderer.js` | 4 | Text annotation renderer |
| `tests/testthat/test_transform_mean.R` | 1 | |
| `tests/testthat/test_transform_summary.R` | 1 | |
| `tests/testthat/test_transform_loess.R` | 2 | |
| `tests/testthat/test_transform_polynomial.R` | 2 | |
| `tests/testthat/test_transform_smooth.R` | 2 | |
| `tests/testthat/test_transform_residuals.R` | 2 | |
| `tests/testthat/test_transform_ci.R` | 3 | |
| `tests/testthat/test_transform_mean_ci.R` | 3 | |
| `tests/testthat/test_transform_input_contracts.R` | 3 | |
| `tests/testthat/test_composite_regression.R` | 4 | |

### Edited files (7)

| File | Phase | Change |
|------|-------|--------|
| `R/transform_registry.R` | 1-3 | Add 8 new entries |
| `R/util.R` | 1-4 | Update ALLOWED_TYPES, VALID_COMBINATIONS, COMPATIBILITY_GROUPS, composite_registry |
| `R/addIoLayer.R` | 3 | Add TRANSFORM_INPUT_CONTRACTS, auto-mapping injection, validation bypass |
| `inst/htmlwidgets/myIO/src/renderers/LineRenderer.js` | 4 | Expand point-suppression list |
| `inst/htmlwidgets/myIO/src/derive/scales.js` | 4 | Filter non-axes layers from extent computation |
| `inst/htmlwidgets/myIO/src/registry.js` | 4 | Import + register TextRenderer |
| `tests/testthat/test_e2e_widgets.R` | 5 | Add statistical chart E2E tests |

### No deleted files

---

## Dependency Order (DAG)

```
Phase 1 ─────────────────────────────────────────────────┐
  transform_mean, transform_summary                      │
  registry + VALID_COMBINATIONS updates                   │
                                                          │
Phase 2 ──────────── (depends on Phase 1 registry)  ─────┤
  transform_loess, transform_polynomial                   │
  transform_smooth, transform_residuals                   │
  registry + VALID_COMBINATIONS updates                   │
                                                          │
Phase 3 ──────────── (depends on Phase 2)  ──────────────┤
  TRANSFORM_INPUT_CONTRACTS + validation refactor         │
  transform_ci (needs validation fix first)               │
  transform_mean_ci (needs validation fix first)          │
  registry + VALID_COMBINATIONS updates                   │
                                                          │
Phase 4 ──────────── (depends on Phase 3)  ──────────────┤
  scales.js fix (BLOCKER B3)                              │
  LineRenderer fix (W9)                                   │
  TextRenderer.js + registry.js                           │
  composite_regression (needs ci, text, all transforms)   │
  util.R final updates                                    │
                                                          │
Phase 5 ──────────── (depends on Phase 4)  ──────────────┘
  E2E tests
  Gallery app updates
```

Each phase is independently shippable and verifiable. Phases 1 and 2 deliver value (new transforms) without touching existing JS or validation logic. Phase 3 is the riskiest (validation refactor) and should be reviewed carefully. Phase 4 completes the JS + composite story. Phase 5 is polish.

---

## Dependencies

**No new R package dependencies.** All computation uses `stats::lm`, `stats::loess`, `stats::predict`, `stats::qt`, `stats::qnorm`, `stats::sd`, `stats::poly`, `stats::filter`, `stats::residuals`, `stats::fitted`. All are in base R `stats` package (already in Imports).

**No new JS dependencies.** TextRenderer uses D3 selections already available. No npm additions.
