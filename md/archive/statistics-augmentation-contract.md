# Statistics Augmentation — Layer Contract

Design doc: `docs/statistics-augmentation-design.md`

## Transforms

| Transform | R function | Registry key | Output shape | Compatible types |
|-----------|-----------|--------------|-------------|-----------------|
| Confidence interval | `transform_ci` | `ci` | grid: `{x_var}`, `low_y`, `high_y` | area |
| LOESS smoothing | `transform_loess` | `loess` | grid: `{x_var}`, `{y_var}`, `_source_key` | line |
| Polynomial regression | `transform_polynomial` | `polynomial` | grid: `{x_var}`, `{y_var}`, `_source_key` | line |
| Group mean | `transform_mean` | `mean` | agg: `{x_var}`, `{y_var}` | point, bar |
| Mean ± CI | `transform_mean_ci` | `mean_ci` | agg: `{x_var}`, `{y_var}`, `low_y`, `high_y`, `n`, `se` | rangeBar |
| Moving average | `transform_smooth` | `smooth` | series: `{x_var}`, `{y_var}`, `_source_key` | line |
| Residuals | `transform_residuals` | `residuals` | series: `{x_var}`, `{y_var}`, `_source_key` | point |
| Summary stats | `transform_summary` | `summary` | agg: `{x_var}`, `{y_var}` | point, bar |

## Transform Options

| Transform | Option | R field | Default | Type |
|-----------|--------|---------|---------|------|
| ci | method | `options$method` | `"lm"` | `"lm"` \| `"loess"` |
| ci | level | `options$level` | `0.95` | numeric (0,1) |
| ci | interval | `options$interval` | `"confidence"` | `"confidence"` \| `"prediction"` |
| ci | n_grid | `options$n_grid` | `100` | integer |
| ci | span | `options$span` | `0.75` | numeric (for loess method) |
| loess | span | `options$span` | `0.75` | numeric |
| loess | degree | `options$degree` | `2` | 1 \| 2 |
| loess | n_grid | `options$n_grid` | `100` | integer |
| polynomial | degree | `options$degree` | `2` | integer ≥ 2 |
| polynomial | n_grid | `options$n_grid` | `100` | integer |
| mean_ci | level | `options$level` | `0.95` | numeric (0,1) |
| mean_ci | method | `options$method` | `"t"` | `"t"` \| `"se"` |
| smooth | method | `options$method` | `"sma"` | `"sma"` \| `"ema"` |
| smooth | window | `options$window` | `7` | integer (for sma) |
| smooth | alpha | `options$alpha` | `0.3` | numeric (0,1) (for ema) |
| residuals | method | `options$method` | `"lm"` | `"lm"` \| `"loess"` \| `"polynomial"` |
| residuals | degree | `options$degree` | `2` | integer (for polynomial) |
| residuals | span | `options$span` | `0.75` | numeric (for loess) |
| summary | stat | `options$stat` | `"count"` | `"count"` \| `"sum"` \| `"sd"` \| `"var"` \| `"min"` \| `"max"` |

## Composite

| Composite | R function | Registry key | Sublayers |
|-----------|-----------|--------------|-----------|
| Regression | `composite_regression` | `regression` | scatter (point/identity), trend (line/lm\|loess\|polynomial), ci_band (area/ci), annotation (text/identity) |

## Composite Options

| Option | R field | Default | Type |
|--------|---------|---------|------|
| method | `options$method` | `"lm"` | `"lm"` \| `"loess"` \| `"polynomial"` |
| showCI | `options$showCI` | `TRUE` | logical |
| level | `options$level` | `0.95` | numeric |
| interval | `options$interval` | `"confidence"` | `"confidence"` \| `"prediction"` |
| showStats | `options$showStats` | `TRUE` | logical |
| degree | `options$degree` | `2` | integer |
| span | `options$span` | `0.75` | numeric |

## JS Renderer

| Renderer | JS class | Registry key | Traits |
|----------|----------|-------------|--------|
| Text annotation | `TextRenderer` | `text` | hasAxes: false, legendType: "none", rolloverStyle: "none" |

## Output Column Names (canonical)

These column names are the contract between R transforms and JS renderers:

| Column | Used by | Meaning |
|--------|---------|---------|
| `low_y` | ci, mean_ci → AreaRenderer, RangeBarRenderer | Lower bound |
| `high_y` | ci, mean_ci → AreaRenderer, RangeBarRenderer | Upper bound |
| `n` | mean_ci | Group sample size |
| `se` | mean_ci | Standard error |
| `text` | TextRenderer | Annotation text content |
| `position` | TextRenderer | Corner position string |

## Registry Updates

### ALLOWED_TYPES additions
`"text"`, `"regression"`

### VALID_COMBINATIONS additions
| Type | Add transforms |
|------|---------------|
| line | `"loess"`, `"polynomial"`, `"smooth"` |
| point | `"mean"`, `"summary"`, `"residuals"` |
| area | `"ci"` |
| bar | `"mean"`, `"summary"` |
| rangeBar | `"mean_ci"` |

### COMPATIBILITY_GROUPS additions
| Type | Group |
|------|-------|
| text | `"axes-continuous"` |
| regression | `"axes-continuous"` |

### addIoLayer auto-mapping
When `transform == "ci"` and `type == "area"`: auto-inject `low_y = "low_y"`, `high_y = "high_y"` into mapping if absent. (Per Decision #11)
