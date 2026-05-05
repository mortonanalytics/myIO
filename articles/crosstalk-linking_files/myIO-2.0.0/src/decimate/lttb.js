// LTTB decimation as a parameterized SQL template (DuckDB dialect).
// LTTB = Largest Triangle Three Buckets -- picks one representative per
// equal-width bucket to preserve visual shape on line/area charts.
// Contract: §Mark-spec enum -- `line` and `area` default to `lttb`.

/**
 * Build a DuckDB SQL template that produces at most `bucket` points,
 * one per ntile bucket, picking the value furthest from the bucket mean.
 * Coordinator slot conventions:
 *   {{source}}   -> source table identifier (validated by R-side whitelist)
 *   {{xcol}}     -> x column identifier (whitelist)
 *   {{ycol}}     -> y column identifier (whitelist)
 *   {{where}}    -> cross-filter predicate, composed by coordinator
 *   {{limit}}    -> row cap (coordinator appends its own)
 *
 * The `bucket` value is an integer baked into the SQL (safe: integer only,
 * no user string). The rest are substituted by the R-side SQL safety
 * pipeline after identifier whitelisting.
 */
export function lttbSQL({ bucket = 1000 } = {}) {
  const n = Math.max(2, Math.floor(Number(bucket) || 1000));
  return `
WITH raw AS (
  SELECT "{{xcol}}" AS x, "{{ycol}}" AS y
  FROM {{source}}
  WHERE {{where}}
),
ordered AS (
  SELECT x, y, NTILE(${n}) OVER (ORDER BY x) AS bkt
  FROM raw
),
with_mean AS (
  SELECT bkt, x, y, AVG(y) OVER (PARTITION BY bkt) AS bkt_mean
  FROM ordered
),
rep AS (
  SELECT bkt, x, y,
         ROW_NUMBER() OVER (
           PARTITION BY bkt
           ORDER BY abs(y - bkt_mean) DESC
         ) AS rn
  FROM with_mean
)
SELECT x, y
FROM rep
WHERE rn = 1
ORDER BY bkt
LIMIT {{limit}};
`.trim();
}

/**
 * Slot manifest -- the R-side SQL safety pipeline needs to know which
 * {{placeholders}} are identifier slots (whitelist-validated against the
 * source schema) vs value slots (parameterized with "?"). For LTTB all
 * placeholders are identifier or coordinator-composed SQL fragments;
 * there are no user-value slots in the base template.
 */
export const lttbSlots = {
  ident_slots: ["source", "xcol", "ycol"],
  value_slots: []
};
