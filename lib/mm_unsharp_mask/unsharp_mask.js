// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussian blur.
//
// Image is converted from RGB to HSV, unsharp mask is applied to the
// brightness channel and then image is converted back to RGB.
//
'use strict';


var glur_mono16 = require('glur/mono16');
var hsv_v16     = require('./hsv_v16');


module.exports = function unsharp(img, width, height, amount, radius, threshold) {
  var r, g, b;
  var max, v1, v2;
  var diff, iTimes4;

  if (amount === 0 || radius < 0.5) {
    return;
  }
  if (radius > 2.0) {
    radius = 2.0;
  }

  var brightness = hsv_v16(img, width, height);

  var blured = new Uint16Array(brightness); // copy, because blur modify src

  glur_mono16(blured, width, height, radius);

  var amountFp = (amount / 100 * 0x1000 + 0.5)|0;
  var thresholdFp = (threshold * 257)|0;

  var size = width * height;

  /* eslint-disable indent */
  for (var i = 0; i < size; i++) {
    diff = 2 * (brightness[i] - blured[i]);

    if (Math.abs(diff) >= thresholdFp) {
      iTimes4 = i * 4;
      r = img[iTimes4];
      g = img[iTimes4 + 1];
      b = img[iTimes4 + 2];

      max = (r >= g && r >= b) ? r : (g >= r && g >= b) ? g : b; // min and max are in [0..0xff]
      v1 = max * 257; // v is in [0..0xffff] that is caused by multiplication by 257

      // add unsharp mask mask to the brightness channel
      v2 = v1 + ((amountFp * diff + 0x800) >> 12);
      if (v2 > 0xffff) {
        v2 = 0xffff;
      } else if (v2 < 0) {
        v2 = 0;
      }

      // Multiplying V in HSV model by a constant is equivalent to multiplying each component
      // in RGB by the same constant (same for HSL), see also:
      // https://beesbuzz.biz/code/16-hsv-color-transforms
      img[iTimes4] = (r * v2 / v1)|0;
      img[iTimes4 + 1] = (g * v2 / v1)|0;
      img[iTimes4 + 2] = (b * v2 / v1)|0;
    }
  }
};
