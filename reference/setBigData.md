# Attach a big-data source to a myIO widget

\`setBigData()\` declares the data source that a myIO widget should use
for large-dataset rendering and linked-selection coordination.

## Usage

``` r
setBigData(widget, source, rowkey_col = NULL, ...)
```

## Arguments

- widget:

  A myIO htmlwidget object.

- source:

  A supported big-data source: a \`data.frame\`, an Arrow table or
  record-batch reader, a single file path or URL ending in \`.parquet\`,
  \`.arrow\`, \`.feather\`, or \`.csv\`, or a \`DBIConnection\`.

- rowkey_col:

  Optional name of the column that uniquely identifies rows for
  Crosstalk-compatible linked selections.

- ...:

  Additional source-specific options. For DBI sources, pass \`table =
  "name"\` so myIO can query the table schema. For file path or URL
  sources, pass \`schema = c("col1", "col2", ...)\` or a schema field
  list.

## Value

A modified myIO htmlwidget object.

## Details

This function writes the \`x.bigdata.\*\` payload fields described in
\`md/design/large-dataset-virtualization-contract.md\`, section "Widget
payload shape", and follows that document's row-key contract. DBI
sources are stored as an internal session-scoped marker in
\`x.bigdata\$dbi_handle_internal\`; render-time source registration is
handled by the source registry phase.

## Examples

``` r
if (FALSE) { # \dontrun{
myIO(data = mtcars) |>
  setBigData(mtcars)

myIO() |>
  setBigData("data/large.parquet", schema = c("id", "x", "y"), rowkey_col = "id")

con <- DBI::dbConnect(duckdb::duckdb())
myIO() |>
  setBigData(con, table = "observations", rowkey_col = "id")
} # }
```
