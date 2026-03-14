export function getSVGString(svgNode) {
  svgNode.setAttribute("xlink", "http://www.w3.org/1999/xlink");
  var cssStyleText = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);

  var serializer = new XMLSerializer();
  var svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, "xmlns:xlink=");
  svgString = svgString.replace(/NS\d+:href/g, "xlink:href");

  return svgString;

  function getCSSStyles(parentElement) {
    var selectorTextArr = [];

    selectorTextArr.push("#" + parentElement.id);
    for (var c = 0; c < parentElement.classList.length; c++) {
      if (!contains("." + parentElement.classList[c], selectorTextArr)) {
        selectorTextArr.push("." + parentElement.classList[c]);
      }
    }

    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id;
      if (!contains("#" + id, selectorTextArr)) {
        selectorTextArr.push("#" + id);
      }

      if ("@" + id) {
        selectorTextArr.push("@" + id);
      }

      var classes = nodes[i].classList;
      for (var j = 0; j < classes.length; j++) {
        if (!contains("." + classes[j], selectorTextArr)) {
          selectorTextArr.push("." + classes[j]);
        }
      }
    }

    var extractedCSSText = "";
    for (var k = 0; k < document.styleSheets.length; k++) {
      var s = document.styleSheets[k];

      try {
        if (!s.cssRules) continue;
      } catch (e) {
        if (e.name !== "SecurityError") throw e;
        continue;
      }

      var cssRules = s.cssRules;

      for (var r = 0; r < cssRules.length; r++) {
        if (contains(cssRules[r].selectorText, selectorTextArr)) {
          extractedCSSText += cssRules[r].cssText;
        }
      }
    }

    return extractedCSSText;

    function contains(str, arr) {
      return arr.indexOf(str) !== -1;
    }
  }

  function appendCSS(cssText, element) {
    var styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    var refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }
}

export function svgString2Image(svgString, width, height, format, callback) {
  var imageFormat = format || "png";
  var imgsrc =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString)));

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  var image = new Image();
  image.onload = function() {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(function(blob) {
      var filesize = Math.round(blob.length / 1024) + " KB";
      if (callback) callback(blob, filesize, imageFormat);
    });
  };

  image.src = imgsrc;
}
