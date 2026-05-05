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
  constructor({ el, width, height, xScale, yScale, palette, captureHoverEvents = false }) {
    this.el = el;
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;
    this.captureHoverEvents = captureHoverEvents !== false;
    this.palette = palette || ["#440154", "#414487", "#2a788e", "#22a884", "#7ad151", "#fde725"];
    this._scatterplot = null;
    this._destroyed = false;
  }

  _scaleCopy(scale) {
    return scale && typeof scale.copy === "function" ? scale.copy() : scale;
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
    canvas.style.pointerEvents = this.captureHoverEvents ? "auto" : "none";
    this.el.appendChild(canvas);
    this._scatterplot = createScatterplot({
      canvas,
      width: this.width,
      height: this.height,
      pointSize: 3,
      backgroundColor: [1, 1, 1, 0],
      colorBy: "category",
      pointColor: this.palette,
      xScale: this._scaleCopy(this.xScale),
      yScale: this._scaleCopy(this.yScale)
    });
    this._applyScales();
    return this._scatterplot;
  }

  _applyScales() {
    if (!this._scatterplot || !this.xScale || !this.yScale) return;
    // Pass scale copies because regl-scatterplot mutates ranges to canvas space.
    if (typeof this._scatterplot.setXScale === "function") {
      this._scatterplot.setXScale(this._scaleCopy(this.xScale));
    }
    if (typeof this._scatterplot.setYScale === "function") {
      this._scatterplot.setYScale(this._scaleCopy(this.yScale));
    }
    if (typeof this._scatterplot.set === "function" &&
        (typeof this._scatterplot.setXScale !== "function" ||
          typeof this._scatterplot.setYScale !== "function")) {
      this._scatterplot.set({
        xScale: this._scaleCopy(this.xScale),
        yScale: this._scaleCopy(this.yScale)
      });
    }
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
    // regl-scatterplot accepts column-oriented arrays keyed by x/y/category/value.
    const pts = {
      x: new Float32Array(rows.length),
      y: new Float32Array(rows.length),
      category: new Float32Array(rows.length),
      value: new Float32Array(rows.length)
    };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      pts.x[i] = r.x;
      pts.y[i] = r.y;
      pts.category[i] = r.category == null ? 0 : r.category;
      pts.value[i] = r.value == null ? 1 : r.value;
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
