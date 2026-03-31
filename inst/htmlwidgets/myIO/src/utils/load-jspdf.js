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
    var scripts = document.querySelectorAll("script[src]");
    var base = "";
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src");
      if (src && src.indexOf("myIOapi") !== -1) {
        // myIOapi.js is at .../myIO-x.y.z/myIOapi.js
        // jsPDF is at .../lib/jspdf/jspdf.umd.min.js
        base = src.substring(0, src.lastIndexOf("/"));
        // Go up one level from the myIO widget dir to htmlwidgets root.
        base = base.substring(0, base.lastIndexOf("/"));
        break;
      }
    }

    var jspdfSrc = base + "/lib/jspdf/jspdf.umd.min.js";

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
