// oxlint-disable-next-line no-unused-expressions -- passed to the preceding extractor function
((function (takeNode, pageRect, textPaintStyles, textStyleKeys, document, window) {
  "use strict";

  // Canvas box effects do not draw CSS inset shadows. Sharp offset-only
  // accents have exact editable geometry; leave other shadow effects intact.
  function captureSharpInsetAccents(styles, rect, children) {
    if (!styles["box-shadow"]) return;
    var shadows = styles["box-shadow"].split(/,(?![^()]*\))/);
    var remaining = [];
    shadows.forEach(function (shadow) {
      var sharp = shadow.trim().match(/^(.*?) (-?[\d.]+)px (-?[\d.]+)px 0px 0px inset$/);
      if (!sharp) {
        remaining.push(shadow.trim());
        return;
      }
      var dx = Number(sharp[2]);
      var dy = Number(sharp[3]);
      var w = Math.min(Math.abs(dx), rect.width);
      var h = Math.min(Math.abs(dy), rect.height);
      function edge(left, top, width, height) {
        if (width < 0.5 || height < 0.5 || !takeNode()) return;
        children.unshift({
          kind: "element", tag: "div",
          rect: pageRect({ left: left, top: top, width: width, height: height }),
          attrs: { "aria-label": "Inset accent" },
          styles: { position: "absolute", "background-color": sharp[1] },
          children: [],
        });
      }
      edge(rect.left + (dx < 0 ? rect.width - w : 0), rect.top, w, rect.height);
      edge(rect.left + (dx > 0 ? w : 0), rect.top + (dy < 0 ? rect.height - h : 0), rect.width - w, h);
    });
    if (remaining.length) styles["box-shadow"] = remaining.join(", ");
    else delete styles["box-shadow"];
  }

  var placeholderMeasure;
  function buildInputPlaceholder(element, computed, rect) {
    var text = element.getAttribute("placeholder");
    if (element.value || !text || !text.trim()) return null;
    var pseudo = window.getComputedStyle(element, "::placeholder");
    if (Number(pseudo.opacity) === 0 || pseudo.visibility === "hidden") return null;
    var left = (parseFloat(computed.paddingLeft) || 0) + element.clientLeft;
    var right = parseFloat(computed.paddingRight) || 0;
    var width = element.clientWidth - (parseFloat(computed.paddingLeft) || 0) - right;
    if (width < 0.5) return null;
    placeholderMeasure = placeholderMeasure || document.createElement("canvas").getContext("2d");
    placeholderMeasure.font = pseudo.font || (pseudo.fontSize + " " + pseudo.fontFamily);
    var metrics = placeholderMeasure.measureText(text);
    var height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    var textWidth = metrics.width + Math.max(0, text.length - 1) * (parseFloat(pseudo.letterSpacing) || 0);
    var alignment = computed.textAlign;
    var end = alignment === "right" || (alignment === "end" && computed.direction === "ltr") ||
      (alignment === "start" && computed.direction === "rtl");
    var offset = end ? width - textWidth : alignment === "center" ? (width - textWidth) / 2 : 0;
    if (!takeNode() || !takeNode()) return null;
    return {
      kind: "element",
      tag: "div",
      rect: pageRect({ left: rect.left + left, top: rect.top, width: width, height: rect.height }),
      styles: { overflow: "hidden", opacity: pseudo.opacity },
      children: [{
        kind: "text",
        rect: pageRect({
          left: rect.left + left + offset, top: rect.top + (rect.height - height) / 2,
          width: textWidth + 1, height: height,
        }),
        text: text,
        lines: 1,
        styles: textPaintStyles(pseudo, textStyleKeys),
      }],
    };
  }

  function captureFormText(element, tag, computed, rect, children) {
    // The native input paints its placeholder through a separate style and clip.
    if (!children.length && tag === "input") {
      var placeholder = buildInputPlaceholder(element, computed, rect);
      if (placeholder) children.push(placeholder);
    }
    // Form value or multiline placeholder when there is no DOM text node.
    if (
      children.length === 0 &&
      (tag === "input" || tag === "textarea" || tag === "select")
    ) {
      var inputText = "";
      if (tag === "select" && element.selectedOptions && element.selectedOptions.length > 0) {
        inputText = (element.selectedOptions[0].textContent || "").trim();
      } else if (typeof element.value === "string" && element.value.trim()) {
        inputText = element.value.trim();
      } else if (tag !== "input" && element.getAttribute && element.getAttribute("placeholder")) {
        inputText = element.getAttribute("placeholder").trim();
      }
      if (inputText && takeNode()) {
        var padLeft = parseFloat(computed.getPropertyValue("padding-left")) || 12;
        var padTop = parseFloat(computed.getPropertyValue("padding-top")) || 8;
        var fontSize = parseFloat(computed.getPropertyValue("font-size")) || 14;
        var textH = Math.min(rect.height, Math.max(fontSize * 1.35, 16));
        var textY = rect.top + Math.max(padTop, (rect.height - textH) / 2);
        children.push({
          kind: "text",
          rect: pageRect({
            left: rect.left + padLeft,
            top: textY,
            width: Math.max(16, rect.width - padLeft * 2),
            height: textH,
          }),
          text: inputText,
          lines: 1,
          styles: textPaintStyles(computed, textStyleKeys),
        });
      }
    }
  }

  return { captureFormText, captureSharpInsetAccents };
}));
