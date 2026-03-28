import { LIGHT, DARK } from "./palettes.js";

function normalizeThemeValues(values) {
  if (!values || typeof values !== "object") {
    return {};
  }

  var normalized = {};
  for (var key of Object.keys(values)) {
    var cssKey = key.startsWith("--") ? key : ("--" + key);
    normalized[cssKey] = values[key];
  }

  return normalized;
}

/**
 * Normalize theme config for backward compatibility.
 * v1.1.0 used a flat dict: { "chart-bg": "#fff" }
 * v1.2.0 uses nested: { mode, preset, values: { "--chart-bg": "#fff" } }
 */
function normalizeThemeConfig(raw) {
  if (!raw || typeof raw !== "object") {
    return { mode: null, preset: null, values: {} };
  }

  if (!("mode" in raw) && !("preset" in raw) && !("values" in raw)) {
    return { mode: null, preset: null, values: normalizeThemeValues(raw) };
  }

  return {
    mode: raw.mode || null,
    preset: raw.preset || null,
    values: normalizeThemeValues(raw.values || {})
  };
}

export class ThemeManager {
  constructor(element, config) {
    this.element = element;
    this.config = normalizeThemeConfig(config ? config.theme : null);
    this.currentMode = null;
    this.mutationObserver = null;
    this.mediaQuery = null;
    this._mediaHandler = null;
    this.listeners = [];
  }

  initialize() {
    var resolved = this.resolveMode();
    this.apply(resolved);

    if (this.config.mode === "auto") {
      this.startListening();
    }
  }

  resolveMode() {
    var mode = this.config.mode;
    if (mode === "light" || mode === "dark") {
      return mode;
    }
    if (mode === "auto") {
      return this.detectEnvironment();
    }
    return "light";
  }

  detectEnvironment() {
    var bsTheme = this.element.closest && this.element.closest("[data-bs-theme]");
    if (bsTheme) {
      return bsTheme.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  apply(mode) {
    this.currentMode = mode;
    var palette = mode === "dark" ? DARK : LIGHT;

    for (var prop of Object.keys(palette)) {
      this.element.style.setProperty(prop, palette[prop]);
    }

    if (this.config.values) {
      for (var key of Object.keys(this.config.values)) {
        this.element.style.setProperty(key, this.config.values[key]);
      }
    }

    this.element.dataset.theme = mode;

    for (var fn of this.listeners) {
      fn(mode);
    }
  }

  startListening() {
    var self = this;

    this.mutationObserver = new MutationObserver(function() {
      var newMode = self.detectEnvironment();
      if (newMode !== self.currentMode) {
        self.apply(newMode);
      }
    });

    var body = document.body;
    if (body) {
      this.mutationObserver.observe(body, {
        attributes: true,
        attributeFilter: ["data-bs-theme"]
      });
    }

    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this._mediaHandler = function() {
        var newMode = self.detectEnvironment();
        if (newMode !== self.currentMode) {
          self.apply(newMode);
        }
      };
      if (typeof this.mediaQuery.addEventListener === "function") {
        this.mediaQuery.addEventListener("change", this._mediaHandler);
      } else if (typeof this.mediaQuery.addListener === "function") {
        this.mediaQuery.addListener(this._mediaHandler);
      }
    }
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.mediaQuery && this._mediaHandler) {
      if (typeof this.mediaQuery.removeEventListener === "function") {
        this.mediaQuery.removeEventListener("change", this._mediaHandler);
      } else if (typeof this.mediaQuery.removeListener === "function") {
        this.mediaQuery.removeListener(this._mediaHandler);
      }
    }
    this.listeners = [];
  }
}
