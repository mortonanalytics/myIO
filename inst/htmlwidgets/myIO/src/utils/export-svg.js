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
    var selectorTextArr = collectSelectors(parentElement);

    var nodes = parentElement.getElementsByTagName("*");
    for (var i = 0; i < nodes.length; i++) {
      selectorTextArr = selectorTextArr.concat(collectSelectors(nodes[i]));
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
        var rule = cssRules[r];
        if (rule.type === CSSRule.FONT_FACE_RULE || rule.selectorText === ":root") {
          extractedCSSText += rule.cssText;
          continue;
        }

        if (matchesRule(rule, parentElement, selectorTextArr)) {
          extractedCSSText += rule.cssText;
        }
      }
    }

    return extractedCSSText;

    function collectSelectors(node) {
      var selectors = [];
      if (node.id) {
        selectors.push("#" + node.id);
      }
      if (node.classList) {
        for (var c = 0; c < node.classList.length; c++) {
          selectors.push("." + node.classList[c]);
        }
      }
      return selectors;
    }

    function matchesRule(rule, rootNode, selectorList) {
      if (!rule.selectorText) {
        return false;
      }

      return rule.selectorText.split(",").some(function(selector) {
        var trimmed = selector.trim();
        if (selectorList.indexOf(trimmed) !== -1) {
          return true;
        }

        try {
          return !!rootNode.querySelector(trimmed);
        } catch (e) {
          return false;
        }
      });
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
