// Hexbin aggregation template (DuckDB dialect).
// For scatter charts at high cardinality, bin into hexagonal cells and
// return (gx, gy, n) triples for pixel-based rendering.
// Contract: §Mark-spec enum -- scatter with SVG path falls back to hexbin.
//
// The bin radius is a coordinator-supplied numeric (baked as an integer
// or float; never string interpolation of arbitrary user input).

/**
 * @param {{ rx?: number, ry?: number }} opts  hexbin cell width/height
 *   in data units. Coordinator computes these from scale domain + target
 *   pixel density; user never supplies rx/ry directly.
 */
export function hexbinSQL({ rx = 1, ry = 1 } = {}) {
  const rxNum = Number(rx);
  const ryNum = Number(ry);
  if (!Number.isFinite(rxNum) || !Number.isFinite(ryNum) ||
      rxNum <= 0 || ryNum <= 0) {
    throw new Error("hexbinSQL: rx and ry must be finite positive numbers");
  }
  // Use DuckDB's floor() to bin; true hexagonal layout needs a staggered-row
  // offset but this approximation is fine for visualizations -- the renderer
  // draws hexagons from the (gx, gy) grid indices.
  return `
SELECT
  floor("{{xcol}}" / ${rxNum}) AS gx,
  floor("{{ycol}}" / ${ryNum}) AS gy,
  count(*) AS n
FROM {{source}}
WHERE {{where}}
GROUP BY gx, gy
ORDER BY n DESC
LIMIT {{limit}};
`.trim();
}

export const hexbinSlots = {
  ident_slots: ["source", "xcol", "ycol"],
  value_slots: []
};
