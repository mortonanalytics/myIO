// WebGLScatter: thin wrapper around regl-scatterplot.
//
// Exposes the interface the coordinator + chart-type glue need: an init
// with container + scales, an update(arrowBatches) to render new data,
// and a destroy() for cleanup. D3 scales drive the domain; color/opacity
// channels map to regl-scatterplot's attribute buffers.
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   §Mark-spec enum (scatter).

export class WebGLScatter {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.el        container element
   * @param {number} opts.width
   * @param {number} opts.height
   * @param {{ domain:()=>[number,number], range:()=>[number,number] }} opts.xScale  d3 scale
   * @param {{ domain:()=>[number,number], range:()=>[number,number] }} opts.yScale  d3 scale
   * @param {Array<string>=} opts.palette  color palette (hex strings), default viridis-like
   */
  constructor({ el, width, height, xScale, yScale, palette }) {
    this.el = el;
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;
    this.palette = palette || ["#440154", "#414487", "#2a788e", "#22a884", "#7ad151", "#fde725"];
    this._scatterplot = null;
    this._destroyed = false;
  }

  async _ensure() {
    if (this._scatterplot) return this._scatterplot;
    // Lazy import so the main bundle can tree-shake if scatter is never used.
    const mod = await import("regl-scatterplot");
    const createScatterplot = mod.default || mod.createScatterplot;
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "auto";
    this.el.appendChild(canvas);
    this._scatterplot = createScatterplot({
      canvas,
      width: this.width,
      height: this.height,
      pointSize: 3,
      backgroundColor: [1, 1, 1, 0],
      colorBy: "category",
      pointColor: this.palette
    });
    this._applyScales();
    return this._scatterplot;
  }

  _applyScales() {
    if (!this._scatterplot || !this.xScale || !this.yScale) return;
    // regl-scatterplot accepts [min, max] ranges in DATA space; we pass the
    // full domain so pan/zoom is relative to the data extent.
    const xDom = this.xScale.domain();
    const yDom = this.yScale.domain();
    this._scatterplot.setXScale([xDom[0], xDom[1]]);
    this._scatterplot.setYScale([yDom[0], yDom[1]]);
  }

  /**
   * Accept aggregated rows (from coordinator) and render them.
   * @param {Array<{x:number,y:number,category?:number}>} rows
   */
  async update(rows) {
    if (this._destroyed) return;
    const sp = await this._ensure();
    if (!rows || rows.length === 0) {
      sp.clear();
      return;
    }
    // regl-scatterplot expects points as [x, y, category, value] tuples.
    const pts = new Float32Array(rows.length * 4);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      pts[i * 4 + 0] = r.x;
      pts[i * 4 + 1] = r.y;
      pts[i * 4 + 2] = r.category == null ? 0 : r.category;
      pts[i * 4 + 3] = r.value == null ? 1 : r.value;
    }
    await sp.draw(pts);
  }

  /**
   * Accept an arrow Table and render (convenience for coordinator integration).
   * Expects columns named "x" and "y", optional "category".
   */
  async updateArrow(table) {
    if (!table) return;
    const xCol = table.getChild ? table.getChild("x") : null;
    const yCol = table.getChild ? table.getChild("y") : null;
    if (!xCol || !yCol) {
      console.warn("[WebGLScatter] update: Arrow Table must have 'x' and 'y' columns");
      return;
    }
    const len = table.numRows || table.length || xCol.length;
    const rows = new Array(len);
    const catCol = table.getChild("category");
    for (let i = 0; i < len; i++) {
      rows[i] = {
        x: Number(xCol.get(i)),
        y: Number(yCol.get(i)),
        category: catCol ? Number(catCol.get(i)) : 0
      };
    }
    return this.update(rows);
  }

  /**
   * Picker: (screen x, screen y) -> index into last rendered rows, or -1.
   * Uses regl-scatterplot's built-in hover/pick.
   */
  hitTest(x, y) {
    if (!this._scatterplot) return -1;
    return this._scatterplot.pickPointInScreen
      ? this._scatterplot.pickPointInScreen(x, y)
      : -1;
  }

  resize(width, height) {
    if (this._destroyed) return;
    this.width = width;
    this.height = height;
    if (this._scatterplot) {
      this._scatterplot.set({ width, height });
    }
  }

  setTransform(t) {
    // Accept a d3-zoom Transform (has k, x, y). Push to scatterplot as view.
    if (!this._scatterplot || !t) return;
    if (typeof this._scatterplot.set === "function") {
      this._scatterplot.set({
        cameraView: [t.k || 1, t.x || 0, t.y || 0]
      });
    }
  }

  destroy() {
    this._destroyed = true;
    if (this._scatterplot) {
      try {
        this._scatterplot.destroy();
      } catch (_) {}
      this._scatterplot = null;
    }
  }
}
