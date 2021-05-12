// Calculates 16-bit precision HSV value from 8-bit rgba buffer
//
'use strict';


module.exports = function hsv_v16_js(img, width, height) {
  var size = width * height;
  var out = new Uint16Array(size);
  var r, g, b, max;
  for (var i = 0; i < size; i++) {
    r = img[4 * i];
    g = img[4 * i + 1];
    b = img[4 * i + 2];
    max = (r >= g && r >= b) ? r : (g >= b && g >= r) ? g : b;
    out[i] = max * 257;
  }
  return out;
};
