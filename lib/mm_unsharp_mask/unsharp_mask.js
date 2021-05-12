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
  var h, s, v;
  var min, max;
  var c, x, m;
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

      // convert RGB to HSV
      // take RGB, 8-bit unsigned integer per each channel
      // save HSV, H and V are 16-bit unsigned integers, S is 12-bit unsigned integer
      // math is taken from here: http://www.easyrgb.com/index.php?X=MATH&H=18
      // and adopted to be integer (fixed point in fact) for sake of performance
      max = (r >= g && r >= b) ? r : (g >= r && g >= b) ? g : b; // min and max are in [0..0xff]
      min = (r <= g && r <= b) ? r : (g <= r && g <= b) ? g : b;
      v = max * 257; // v is in [0..0xffff] that is caused by multiplication by 257

      if (min === max) {
        h = s = 0;
      } else {
        s = ((max - min) * 0xfff / max)|0;
        h = (r === max) ? (((g - b) * 0xffff) / (6 * (max - min)))|0
          : (g === max) ? 0x5555 + ((((b - r) * 0xffff) / (6 * (max - min)))|0) // 0x5555 == 0xffff / 3
          : 0xaaaa + ((((r - g) * 0xffff) / (6 * (max - min)))|0); // 0xaaaa == 0xffff * 2 / 3
        // h could be less than 0, |h| <= 0xffff / 6
        if (h < 0) h += 0x10000;
      }

      // add unsharp mask mask to the brightness channel
      v += (amountFp * diff + 0x800) >> 12;
      if (v > 0xffff) {
        v = 0xffff;
      } else if (v < 0) {
        v = 0;
      }

      // convert HSV back to RGB
      // for information about math look above
      if (s === 0) {
        r = g = b = v >> 8;
      } else {
        // formulae below are from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB,
        // adapted to use integer math for performance reasons
        c = (v * (s / 0xfff))|0;
        m = v - c;

        /* eslint-disable no-lonely-if */
        if (h <= 0x7fff) {
          if (h <= 0x2aaa) {
            x = (c * (h / 0x2aaa))|0;
            r = (c + m) >> 8; g = (x + m) >> 8; b = m >> 8;
          } else if (h <= 0x5555) {
            x = (c * ((0x5555 - h) / 0x2aaa))|0;
            r = (x + m) >> 8; g = (c + m) >> 8; b = m >> 8;
          } else {
            x = (c * ((h - 0x5555) / 0x2aaa))|0;
            r = m >> 8; g = (c + m) >> 8; b = (x + m) >> 8;
          }
        } else {
          if (h <= 0xaaaa) {
            x = (c * ((0xaaaa - h) / 0x2aaa))|0;
            r = m >> 8; g = (x + m) >> 8; b = (c + m) >> 8;
          } else if (h <= 0xd555) {
            x = (c * ((h - 0xaaaa) / 0x2aaa))|0;
            r = (x + m) >> 8; g = m >> 8; b = (c + m) >> 8;
          } else {
            x = (c * ((0xffff - h) / 0x2aaa))|0;
            r = (c + m) >> 8; g = m >> 8; b = (x + m) >> 8;
          }
        }
      }

      img[iTimes4] = r;
      img[iTimes4 + 1] = g;
      img[iTimes4 + 2] = b;
    }
  }
};
