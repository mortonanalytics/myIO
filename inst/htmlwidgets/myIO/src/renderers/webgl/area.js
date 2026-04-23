// WebGLArea: custom regl TRIANGLE_STRIP renderer. Pairs each point with a
// baseline vertex to form a filled area between the line and y = baseline.
//
// Contract: §Mark-spec enum (area).

export class WebGLArea {
  constructor({ el, width, height, xScale, yScale, color, baseline }) {
    this.el = el;
    this.width = width;
    this.height = height;
    this.xScale = xScale;
    this.yScale = yScale;
    this.color = color || [0.13, 0.45, 0.70, 0.35];
    // baseline is in data space; default to yScale.domain()[0]
    this.baseline = baseline != null ? baseline : null;
    this._regl = null;
    this._draw = null;
    this._destroyed = false;
  }

  async _ensure() {
    if (this._regl) return;
    const reglMod = await import("regl");
    const regl = reglMod.default || reglMod;
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    this.el.appendChild(canvas);
    this._regl = regl({
      canvas,
      attributes: { antialias: true, preserveDrawingBuffer: false }
    });
    this._draw = this._regl({
      vert: `
        precision mediump float;
        attribute vec2 position;
        uniform vec2 xDomain;
        uniform vec2 yDomain;
        void main() {
          float nx = (position.x - xDomain.x) / (xDomain.y - xDomain.x) * 2.0 - 1.0;
          float ny = (position.y - yDomain.x) / (yDomain.y - yDomain.x) * 2.0 - 1.0;
          gl_Position = vec4(nx, ny, 0.0, 1.0);
        }
      `,
      frag: `
        precision mediump float;
        uniform vec4 color;
        void main() { gl_FragColor = color; }
      `,
      attributes: { position: this._regl.prop("position") },
      uniforms: {
        xDomain: this._regl.prop("xDomain"),
        yDomain: this._regl.prop("yDomain"),
        color: this._regl.prop("color")
      },
      count: this._regl.prop("count"),
      primitive: "triangle strip"
    });
    this._buffer = this._regl.buffer({
      type: "float32",
      usage: "dynamic",
      length: 0
    });
  }

  async update(points) {
    if (this._destroyed) return;
    await this._ensure();
    if (!points || points.length === 0) {
      this._regl.clear({ color: [0, 0, 0, 0] });
      return;
    }
    const base = this.baseline != null ? this.baseline : this.yScale.domain()[0];
    // Emit pairs: (x, y), (x, base), per data point. Two vertices per point,
    // consumed as triangle strip.
    const flat = new Float32Array(points.length * 4);
    for (let i = 0; i < points.length; i++) {
      flat[i * 4] = points[i].x;
      flat[i * 4 + 1] = points[i].y;
      flat[i * 4 + 2] = points[i].x;
      flat[i * 4 + 3] = base;
    }
    this._buffer({ data: flat });
    const xDom = this.xScale.domain();
    const yDom = this.yScale.domain();
    this._regl.clear({ color: [0, 0, 0, 0] });
    this._draw({
      position: this._buffer,
      xDomain: [xDom[0], xDom[1]],
      yDomain: [yDom[0], yDom[1]],
      color: this.color,
      count: points.length * 2
    });
  }

  async updateArrow(table) {
    if (!table || !table.getChild) return;
    const xCol = table.getChild("x");
    const yCol = table.getChild("y");
    if (!xCol || !yCol) return;
    const len = table.numRows || xCol.length;
    const pts = new Array(len);
    for (let i = 0; i < len; i++) {
      pts[i] = { x: Number(xCol.get(i)), y: Number(yCol.get(i)) };
    }
    return this.update(pts);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    if (this._regl) this._regl.poll();
  }

  destroy() {
    this._destroyed = true;
    if (this._regl) {
      try {
        this._regl.destroy();
      } catch (_) {}
      this._regl = null;
    }
  }
}
