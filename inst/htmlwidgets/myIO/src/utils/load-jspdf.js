var _jspdfPromise = null;

/**
 * Lazy-load jsPDF on first use via script injection.
 * Returns a Promise that resolves to the jsPDF constructor.
 * Caches the promise to deduplicate concurrent calls.
 */
export function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) {
    return Promise.resolve(window.jspdf.jsPDF);
  }
  if (_jspdfPromise) return _jspdfPromise;

  _jspdfPromise = new Promise(function(resolve, reject) {
    // Find the myIO widget script to derive the base path.
    // myIOapi.js is at .../myIO-x.y.z/myIOapi.js; jsPDF is at .../lib/jspdf/jspdf.umd.min.js
    // Use URL resolution so '/./' segments (Shiny htmlwidgets) normalize correctly.
    var scripts = document.querySelectorAll("script[src]");
    var scriptUrl = null;
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src");
      if (src && src.indexOf("myIOapi") !== -1) {
        scriptUrl = new URL(scripts[i].src, document.baseURI);
        break;
      }
    }

    var jspdfSrc = scriptUrl
      ? new URL("lib/jspdf/jspdf.umd.min.js", scriptUrl).href
      : "lib/jspdf/jspdf.umd.min.js";

    var script = document.createElement("script");
    script.src = jspdfSrc;
    script.onload = function() {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        _jspdfPromise = null;
        reject(new Error("[myIO] jsPDF loaded but constructor not found"));
      }
    };
    script.onerror = function() {
      _jspdfPromise = null;
      reject(new Error("[myIO] Failed to load jsPDF from " + jspdfSrc));
    };
    document.head.appendChild(script);
  });

  return _jspdfPromise;
}
