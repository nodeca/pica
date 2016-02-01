/* pica 1.1.1 nodeca/pica */(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pica = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// High speed resize with tuneable speed/quality ratio

'use strict';


var unsharp = require('./unsharp');


// Precision of fixed FP values
var FIXED_FRAC_BITS = 14;
var FIXED_FRAC_VAL  = 1 << FIXED_FRAC_BITS;


//
// Presets for quality 0..3. Filter functions + window size
//
var FILTER_INFO = [
  { // Nearest neibor (Box)
    win: 0.5,
    filter: function (x) {
      return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
    }
  },
  { // Hamming
    win: 1.0,
    filter: function (x) {
      if (x <= -1.0 || x >= 1.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return ((Math.sin(xpi) / xpi) *  (0.54 + 0.46 * Math.cos(xpi / 1.0)));
    }
  },
  { // Lanczos, win = 2
    win: 2.0,
    filter: function (x) {
      if (x <= -2.0 || x >= 2.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
    }
  },
  { // Lanczos, win = 3
    win: 3.0,
    filter: function (x) {
      if (x <= -3.0 || x >= 3.0) { return 0.0; }
      if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
      var xpi = x * Math.PI;
      return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
    }
  }
];

function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }

function toFixedPoint(num) { return Math.floor(num * FIXED_FRAC_VAL); }


// Calculate convolution filters for each destination point,
// and pack data to Int16Array:
//
// [ shift, length, data..., shift2, length2, data..., ... ]
//
// - shift - offset in src image
// - length - filter length (in src points)
// - data - filter values sequence
//
function createFilters(quality, srcSize, destSize) {

  var filterFunction = FILTER_INFO[quality].filter;

  var scale         = destSize / srcSize;
  var scaleInverted = 1.0 / scale;
  var scaleClamped  = Math.min(1.0, scale); // For upscale

  // Filter window (averaging interval), scaled to src image
  var srcWindow = FILTER_INFO[quality].win / scaleClamped;

  var destPixel, srcPixel, srcFirst, srcLast, filterElementSize,
      floatFilter, fxpFilter, total, fixedTotal, pxl, idx, floatVal, fixedVal;
  var leftNotEmpty, rightNotEmpty, filterShift, filterSize;

  var maxFilterElementSize = Math.floor((srcWindow + 1) * 2);
  var packedFilter    = new Int16Array((maxFilterElementSize + 2) * destSize);
  var packedFilterPtr = 0;

  // For each destination pixel calculate source range and built filter values
  for (destPixel = 0; destPixel < destSize; destPixel++) {

    // Scaling should be done relative to central pixel point
    srcPixel = (destPixel + 0.5) * scaleInverted;

    srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
    srcLast  = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));

    filterElementSize = srcLast - srcFirst + 1;
    floatFilter = new Float32Array(filterElementSize);
    fxpFilter = new Int16Array(filterElementSize);

    total = 0.0;

    // Fill filter values for calculated range
    for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
      floatVal = filterFunction(((pxl + 0.5) - srcPixel) * scaleClamped);
      total += floatVal;
      floatFilter[idx] = floatVal;
    }

    // Normalize filter, convert to fixed point and accumulate conversion error
    fixedTotal = 0;

    for (idx = 0; idx < floatFilter.length; idx++) {
      fixedVal = toFixedPoint(floatFilter[idx] / total);
      fixedTotal += fixedVal;
      fxpFilter[idx] = fixedVal;
    }

    // Compensate normalization error, to minimize brightness drift
    fxpFilter[destSize >> 1] += toFixedPoint(1.0) - fixedTotal;

    //
    // Now pack filter to useable form
    //
    // 1. Trim heading and tailing zero values, and compensate shitf/length
    // 2. Put all to single array in this format:
    //
    //    [ pos shift, data length, value1, value2, value3, ... ]
    //

    leftNotEmpty = 0;
    while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) {
      leftNotEmpty++;
    }

    if (leftNotEmpty < fxpFilter.length) {
      rightNotEmpty = fxpFilter.length - 1;
      while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) {
        rightNotEmpty--;
      }

      filterShift = srcFirst + leftNotEmpty;
      filterSize = rightNotEmpty - leftNotEmpty + 1;

      packedFilter[packedFilterPtr++] = filterShift; // shift
      packedFilter[packedFilterPtr++] = filterSize; // size

      packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
      packedFilterPtr += filterSize;
    } else {
      // zero data, write header only
      packedFilter[packedFilterPtr++] = 0; // shift
      packedFilter[packedFilterPtr++] = 0; // size
    }
  }
  return packedFilter;
}

// Convolve image in horizontal directions and transpose output. In theory,
// transpose allow:
//
// - use the same convolver for both passes (this fails due different
//   types of input array and temporary buffer)
// - making vertical pass by horisonltal lines inprove CPU cache use.
//
// But in real life this doesn't work :)
//
function convolveHorizontally(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    /*eslint-disable space-infix-ops*/

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}

// Technically, convolvers are the same. But input array and temporary
// buffer can be of different type (especially, in old browsers). So,
// keep code in separate functions to avoid deoptimizations & speed loss.

function convolveVertically(src, dest, srcW, srcH, destW, filters) {

  var r, g, b, a;
  var filterPtr, filterShift, filterSize;
  var srcPtr, srcY, destX, filterVal;
  var srcOffset = 0, destOffset = 0;

  // For each row
  for (srcY = 0; srcY < srcH; srcY++) {
    filterPtr  = 0;

    /*eslint-disable space-infix-ops*/

    // Apply precomputed filters to each destination row point
    for (destX = 0; destX < destW; destX++) {
      // Get the filter that determines the current output pixel.
      filterShift = filters[filterPtr++];
      filterSize  = filters[filterPtr++];

      srcPtr = (srcOffset + (filterShift * 4))|0;

      r = g = b = a = 0;

      // Apply the filter to the row to get the destination pixel r, g, b, a
      for (; filterSize > 0; filterSize--) {
        filterVal = filters[filterPtr++];

        // Use reverse order to workaround deopts in old v8 (node v.10)
        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
        a = (a + filterVal * src[srcPtr + 3])|0;
        b = (b + filterVal * src[srcPtr + 2])|0;
        g = (g + filterVal * src[srcPtr + 1])|0;
        r = (r + filterVal * src[srcPtr])|0;
        srcPtr = (srcPtr + 4)|0;
      }

      // Bring this value back in range. All of the filter scaling factors
      // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
      //
      // (!) Add 1/2 of value before clamping to get proper rounding. In other
      // case brightness loss will be noticeable if you resize image with white
      // border and place it on white background.
      //
      dest[destOffset + 3] = clampTo8((a + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 2] = clampTo8((b + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset + 1] = clampTo8((g + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      dest[destOffset]     = clampTo8((r + (1 << 13)) >> 14/*FIXED_FRAC_BITS*/);
      destOffset = (destOffset + srcH * 4)|0;
    }

    destOffset = ((srcY + 1) * 4)|0;
    srcOffset  = ((srcY + 1) * srcW * 4)|0;
  }
}


function resetAlpha(dst, width, height) {
  var ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


function resize(options) {
  var src   = options.src;
  var srcW  = options.width;
  var srcH  = options.height;
  var destW = options.toWidth;
  var destH = options.toHeight;
  var dest  = options.dest || new Uint8Array(destW * destH * 4);
  var quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  var alpha = options.alpha || false;
  var unsharpAmount = typeof options.unsharpAmount === 'undefined' ? 0 : (options.unsharpAmount|0);
  var unsharpRadius = typeof options.unsharpRadius === 'undefined' ? 0 : (options.unsharpRadius);
  var unsharpThreshold = typeof options.unsharpThreshold === 'undefined' ? 0 : (options.unsharpThreshold|0);

  if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) { return []; }

  var filtersX = createFilters(quality, srcW, destW),
      filtersY = createFilters(quality, srcH, destH);

  var tmp  = new Uint8Array(destW * srcH * 4);

  // To use single function we need src & tmp of the same type.
  // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
  // vertical and horizontal passes separately to avoid deoptimization.

  convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
  convolveVertically(tmp, dest, srcH, destW, destH, filtersY);

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) {
    resetAlpha(dest, destW, destH);
  }

  if (unsharpAmount) {
    unsharp(dest, destW, destH, unsharpAmount, unsharpRadius, unsharpThreshold);
  }

  return dest;
}


module.exports = resize;

},{"./unsharp":2}],2:[function(require,module,exports){
// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussian blur.
//
// Image is converted from RGB to HSL, unsharp mask is applied to the
// lightness channel and then image is converted back to RGB.

'use strict';


var glurMono16 = require('glur/mono16');

function getLightness(img, width, height) {
  var size = width * height;
  var out = new Uint16Array(size);
  var r, g, b, min, max;
  for (var i = 0; i < size; i++) {
    r = img[4 * i];
    g = img[4 * i + 1];
    b = img[4 * i + 2];
    max = (r >= g && r >= b) ? r : (g >= b && g >= r) ? g : b;
    min = (r <= g && r <= b) ? r : (g <= b && g <= r) ? g : b;
    out[i] = (max + min) * 257 >> 1;
  }
  return out;
}

function unsharp(img, width, height, amount, radius, threshold) {
  var r, g, b;
  var h, s, l;
  var min, max;
  var m1, m2, hShifted;
  var diff, iTimes4;

  if (amount === 0 || radius < 0.5) {
    return;
  }

  var lightness = getLightness(img, width, height);

  var blured = new Uint16Array(lightness); // copy, because blur modify src

  glurMono16(blured, width, height, radius);

  /* eslint-disable space-infix-ops */
  var amountFp = (amount / 100 * 0x1000 + 0.5)|0;
  var thresholdFp = (threshold * 257)|0;

  var size = width * height;

  for (var i = 0; i < size; i++) {
    diff = 2 * (lightness[i] - blured[i]);

    if (Math.abs(diff) >= thresholdFp) {
      iTimes4 = i * 4;
      r = img[iTimes4];
      g = img[iTimes4 + 1];
      b = img[iTimes4 + 2];

      // convert RGB to HSL
      // take RGB, 8-bit unsigned integer per each channel
      // save HSL, H and L are 16-bit unsigned integers, S is 12-bit unsigned integer
      // math is taken from here: http://www.easyrgb.com/index.php?X=MATH&H=18
      // and adopted to be integer (fixed point in fact) for sake of performance
      max = (r >= g && r >= b) ? r : (g >= r && g >= b) ? g : b; // min and max are in [0..0xff]
      min = (r <= g && r <= b) ? r : (g <= r && g <= b) ? g : b;
      l = (max + min) * 257 >> 1; // l is in [0..0xffff] that is caused by multiplication by 257

      if (min === max) {
        h = s = 0;
      } else {
        s = (l <= 0x7fff) ?
          (((max - min) * 0xfff) / (max + min))|0 :
          (((max - min) * 0xfff) / (2 * 0xff - max - min))|0; // s is in [0..0xfff]
        // h could be less 0, it will be fixed in backward conversion to RGB, |h| <= 0xffff / 6
        h = (r === max) ? (((g - b) * 0xffff) / (6 * (max - min)))|0
          : (g === max) ? 0x5555 + ((((b - r) * 0xffff) / (6 * (max - min)))|0) // 0x5555 == 0xffff / 3
          : 0xaaaa + ((((r - g) * 0xffff) / (6 * (max - min)))|0); // 0xaaaa == 0xffff * 2 / 3
      }

      // add unsharp mask mask to the lightness channel
      l += (amountFp * diff + 0x800) >> 12;
      if (l > 0xffff) {
        l = 0xffff;
      } else if (l < 0) {
        l = 0;
      }

      // convert HSL back to RGB
      // for information about math look above
      if (s === 0) {
        r = g = b = l >> 8;
      } else {
        m2 = (l <= 0x7fff) ? (l * (0x1000 + s) + 0x800) >> 12 :
          l  + (((0xffff - l) * s + 0x800) >>  12);
        m1 = 2 * l - m2 >> 8;
        m2 >>= 8;
        // save result to RGB channels
        // R channel
        hShifted = (h + 0x5555) & 0xffff; // 0x5555 == 0xffff / 3
        r = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // G channel
        hShifted = h & 0xffff;
        g = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
        // B channel
        hShifted = (h - 0x5555) & 0xffff;
        b = (hShifted >= 0xaaaa) ? m1 // 0xaaaa == 0xffff * 2 / 3
          : (hShifted >= 0x7fff) ?  m1 + ((m2 - m1) * 6 * (0xaaaa - hShifted) + 0x8000 >> 16)
          : (hShifted >= 0x2aaa) ? m2 // 0x2aaa == 0xffff / 6
          : m1 + ((m2 - m1) * 6 * hShifted + 0x8000 >> 16);
      }

      img[iTimes4] = r;
      img[iTimes4 + 1] = g;
      img[iTimes4 + 2] = b;
    }
  }
}

module.exports = unsharp;
module.exports.lightness = getLightness;

},{"glur/mono16":6}],3:[function(require,module,exports){
// Proxy to simplify split between webworker/plain calls
'use strict';

var resize = require('./pure/resize');

module.exports = function (options, callback) {
  var output = resize(options);

  callback(null, output);
};

},{"./pure/resize":1}],4:[function(require,module,exports){
/*global window,document*/
'use strict';


var unsharp = require('./pure/unsharp');


function error(msg) {
  try { (window.console.error || window.console.log).call(window.console, msg); } catch (__) {}
}


function checkGlError(gl) {
  var e = gl.getError();
  if (e !== gl.NO_ERROR) {
    var msg = 'gl error ' + e;
    throw msg
  }
}


function createGl(canvas) {
  return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
}


function createShader(gl, type, src) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    error('Shader compile error: ' + gl.getShaderInfoLog(shader) + '. Source: `' + src + '`');
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function createProgram(gl, shaders, attrs, locations) {
  var program = gl.createProgram();

  shaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });

  if (attrs) {
    attrs.forEach(function (attr, idx) {
      gl.bindAttribLocation(program, locations ? locations[idx] : idx, attr);
    });
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    error('Program linking error: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}


function createShader2(gl, vsh, fsh) {
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vsh);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsh);
  var program = createProgram(gl, [ vertexShader, fragmentShader ]);
  checkGlError(gl);
  return program;
}


var shadersCache = {};


function loadShaders() {
  if (Object.keys(shadersCache).length) {
    return;
  }

  

  /*eslint-disable no-path-concat*/
  shadersCache['#vsh-basic'] =
    "precision highp float;\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\n\nuniform vec2 u_resolution;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n   vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;\n\n   gl_Position = vec4(clipSpace, 0, 1);\n   v_texCoord = a_texCoord;\n}\n";
  shadersCache['#fsh-simple-texture'] =
    "precision highp float;\nuniform sampler2D u_image;\n\nvarying vec2 v_texCoord;\n\nvoid main() {\n   gl_FragColor = texture2D(u_image, v_texCoord);\n}\n";
  shadersCache['#fsh-box-1d-covolve-horizontal'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.x / u_resolution.x;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(pixel.x * k, 0.);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float b = (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;\n    if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
  shadersCache['#fsh-box-1d-covolve-vertical'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.y / u_resolution.y;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(0., pixel.y * k);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float b = (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;\n    if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
  shadersCache['#fsh-hamming-1d-covolve-horizontal'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.x / u_resolution.x;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(pixel.x * k, 0.);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float xpi = x * M_PI;\n    float b = sinc(xpi) * (0.54 + 0.46 * cos(xpi));\n    if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
  shadersCache['#fsh-hamming-1d-covolve-vertical'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.y / u_resolution.y;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(0., pixel.y * k);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float xpi = x * M_PI;\n    float b = sinc(xpi) * (0.54 + 0.46 * cos(xpi));\n     if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
  shadersCache['#fsh-lanczos-1d-covolve-horizontal'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.x / u_resolution.x;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(pixel.x * k, 0.);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float xpi = x * M_PI;\n    float b = sinc(xpi) * sinc(xpi / u_winSize);\n    if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
  shadersCache['#fsh-lanczos-1d-covolve-vertical'] =
    "precision highp float;\nuniform vec2 u_resolution;\nuniform sampler2D u_image;\nuniform vec2 u_imageSize;\nuniform float u_winSize;\n\nvarying vec2 v_texCoord;\n\n#define sinc(a) (sin(a)/a)\n#define M_PI 3.1415926535897932384626433832795\n\nvoid main() {\n  vec2 pixel = vec2(1.) / u_imageSize;\n  gl_FragColor = vec4(0.);\n\n  float total = 0.;\n  float scale = u_imageSize.y / u_resolution.y;\n  float count = u_winSize * scale * 2.;\n  for (int i = 0; i < 1024*8; i++) {\n    if (float(i) >= count) {\n      break;\n    }\n    float k = float(i) - (count / 2.);\n    vec2 offset = vec2(0., pixel.y * k);\n    vec4 c = texture2D(u_image, v_texCoord+offset);\n    float x = k / scale; // max [-3, 3]\n    float xpi = x * M_PI;\n    float b = sinc(xpi) * sinc(xpi / u_winSize);\n    if (x > -1.19209290E-07 && x < 1.19209290E-07) { \n      b = 1.;\n    }\n    total += b;\n    c *= vec4(b);\n    gl_FragColor += c;\n  }\n  gl_FragColor /= vec4(total);\n}\n";
}


function createShader2file(gl, vshFile, fshFile) {
  var vsh = shadersCache[vshFile];
  var fsh = shadersCache[fshFile];
  return createShader2(gl, vsh, fsh);
}


function setAttributeValues(gl, program, name, values, options) {
  var a = gl.getAttribLocation(program, name);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, options.elementSize, gl.FLOAT, false, 0, 0);
  checkGlError(gl);
}


function loadTexture(gl, texUnit, data) {
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  checkGlError(gl);
  return tex;
}


function setUniform1i(gl, program, name, i0) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform1i(u, i0);
}


function setUniform1f(gl, program, name, f0) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform1f(u, f0);
}


function setUniform2f(gl, program, name, f0, f1) {
  var u = gl.getUniformLocation(program, name);
  gl.uniform2f(u, f0, f1);
}


function vec2Rectangle(x, y, w, h) {
  var x1 = x;
  var x2 = x + w;
  var y1 = y;
  var y2 = y + h;
  return [ x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2 ];
}


function createTextureSize(gl, texUnit, width, height) {
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + texUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  checkGlError(gl);
  return tex;
}


function setupTextureFBO(gl, texUnit, width, height) {
  var texture = createTextureSize(gl, texUnit, width, height);

  var oldFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

//  gl.viewport(0, 0, width, height);

  checkGlError(gl);

  return {
    fbo: fbo,
    texture: texture,
    oldFbo: oldFbo
  };
}


function webglProcessResize(from, gl, options) {

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  var basicProgram;
  var resizeProgram;

  var program;

  var bigsize = {
    width: from.width,
    height: from.height
  };

  loadShaders();

  basicProgram = createShader2file(gl, '#vsh-basic', '#fsh-simple-texture');

  var texUnit0 = 0;
  /*var tex = */loadTexture(gl, texUnit0, from);

  var tsize = {
    width: bigsize.width,
    height: bigsize.height
  };

  // resize [

  function convolve(texUnit0, texWidth, texHeight, texUnit, fsh, winSize, width, height) {
    var outsize = {
      width: width,
      height: height
    };

    resizeProgram = createShader2file(gl, '#vsh-basic', fsh);
    program = resizeProgram;
    gl.useProgram(program);

    setUniform1f(gl, program, 'u_winSize', winSize);
    setUniform1i(gl, program, 'u_image', texUnit0);
    setUniform2f(gl, program, 'u_imageSize', texWidth, texHeight);
    setUniform2f(gl, program, 'u_resolution', outsize.width, outsize.height);
    setAttributeValues(gl, program, 'a_texCoord',
      [ 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1 ], { elementSize: 2 });
    setAttributeValues(gl, program, 'a_position',
      vec2Rectangle(0, 0, outsize.width, outsize.height), { elementSize: 2 });
    gl.viewport(0, 0, outsize.width, outsize.height);

    var fboObject = setupTextureFBO(gl, texUnit, outsize.width, outsize.height);

    gl.viewport(0, 0, outsize.width, outsize.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboObject.oldFbo);

    checkGlError(gl);

    return fboObject;
  }

  var winSize = typeof options.quality === 'undefined' ? 3 : options.quality;

  var texUnit2 = 2;
  var texUnit3 = 3;

  var shaders = [
    { // Nearest neibor (Box)
      win: 0.5,
      horizontal: '#fsh-box-1d-covolve-horizontal',
      vertical: '#fsh-box-1d-covolve-vertical'
    },
    { // Hamming
      win: 1.0,
      horizontal: '#fsh-hamming-1d-covolve-horizontal',
      vertical: '#fsh-hamming-1d-covolve-vertical'
    },
    { // Lanczos, win = 2
      win: 2.0,
      horizontal: '#fsh-lanczos-1d-covolve-horizontal',
      vertical: '#fsh-lanczos-1d-covolve-vertical'
    },
    { // Lanczos, win = 3
      win: 3.0,
      horizontal: '#fsh-lanczos-1d-covolve-horizontal',
      vertical: '#fsh-lanczos-1d-covolve-vertical'
    }
  ];

  convolve(texUnit0, tsize.width, tsize.height,
    texUnit2, shaders[winSize].horizontal, shaders[winSize].win, gl.canvas.width, tsize.height);

  var finalFboObject = convolve(texUnit2, gl.canvas.width, tsize.height,
    texUnit3, shaders[winSize].vertical, shaders[winSize].win, gl.canvas.width, gl.canvas.height);

  // resize ]
  // final draw to canvas (for debug) [

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  var texUnitOutput = texUnit3;

  program = basicProgram;
  gl.useProgram(program);
  setUniform1i(gl, program, 'u_image', texUnitOutput);
  setUniform2f(gl, program, 'u_resolution', gl.canvas.width, gl.canvas.height);
  setAttributeValues(gl, program, 'a_texCoord',
    [ 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1 ], { elementSize: 2 });
  setAttributeValues(gl, program, 'a_position',
    vec2Rectangle(0, 0, gl.canvas.width, gl.canvas.height), { elementSize: 2 });

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  checkGlError(gl);

  // final draw to canvas (for debug) ]

  gl.flush();

  var fb = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, finalFboObject.texture, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var destW = width;
    var destH = height;
    var dest = pixels;
    var unsharpAmount = typeof options.unsharpAmount === 'undefined' ? 0 : (options.unsharpAmount | 0);
    var unsharpRadius = typeof options.unsharpRadius === 'undefined' ? 0 : (options.unsharpRadius);
    var unsharpThreshold = typeof options.unsharpThreshold === 'undefined' ? 0 : (options.unsharpThreshold | 0);

    if (unsharpAmount) {
      unsharp(dest, destW, destH, unsharpAmount, unsharpRadius, unsharpThreshold);
    }

    return dest;
  }
}


module.exports = function (from, to, options, callback) {
  var gl, canvas;

  try {
    // create temporarry canvas [

    canvas = document.createElement('canvas');
    canvas.id = 'pica-webgl-temporarry-canvas';
    canvas.height = to.height;
    canvas.width = to.width;
    document.body.appendChild(canvas);

    // create temporarry canvas ]

    gl = createGl(canvas);

    var data = webglProcessResize(from, gl, options);

    gl.finish();
    document.body.removeChild(canvas);

    var w2 = to.width;
    var h2 = to.height;
    var ctxTo = to.getContext('2d');
    var imageDataTo = ctxTo.getImageData(0, 0, w2, h2);

    // copy flipped y

    var i, j, p0, p1;

    for (j = 0; j < h2; j++) {
      for (i = 0; i < w2; i++) {
        p0 = (i + j * w2) * 4;
        p1 = (i + (h2 - j - 1) * w2) * 4;
//          p1 = (i + j*w2)*4;
        imageDataTo.data[p0] = data[p1];
        imageDataTo.data[p0 + 1] = data[p1 + 1];
        imageDataTo.data[p0 + 2] = data[p1 + 2];
        imageDataTo.data[p0 + 3] = data[p1 + 3];
      }
    }

    ctxTo.putImageData(imageDataTo, 0, 0);

    callback(null, data);
  } catch (e) {
    error(e);
    gl.finish();
    document.body.removeChild(canvas);
    callback(e);
  }

  return null; // No webworker
};

},{"./pure/unsharp":2}],5:[function(require,module,exports){
// Web Worker wrapper for image resize function

'use strict';

module.exports = function(self) {
  var resize = require('./resize');

  self.onmessage = function (ev) {
    resize(ev.data, function(err, output) {
      if (err) {
        self.postMessage({ err: err });
        return;
      }

      self.postMessage({ output: output }, [ output.buffer ]);
    });
  };
};

},{"./resize":3}],6:[function(require,module,exports){
// Calculate Gaussian blur of an image using IIR filter
// The method is taken from Intel's white paper and code example attached to it:
// https://software.intel.com/en-us/articles/iir-gaussian-blur-filter
// -implementation-using-intel-advanced-vector-extensions

var a0, a1, a2, a3, b1, b2, left_corner, right_corner;

function gaussCoef(sigma) {
  if (sigma < 0.5) {
    sigma = 0.5;
  }

  var a = Math.exp(0.726 * 0.726) / sigma,
      g1 = Math.exp(-a),
      g2 = Math.exp(-2 * a),
      k = (1 - g1) * (1 - g1) / (1 + 2 * a * g1 - g2);

  a0 = k;
  a1 = k * (a - 1) * g1;
  a2 = k * (a + 1) * g1;
  a3 = -k * g2;
  b1 = 2 * g1;
  b2 = -g2;
  left_corner = (a0 + a1) / (1 - b1 - b2);
  right_corner = (a2 + a3) / (1 - b1 - b2);

  // Attempt to force type to FP32.
  return new Float32Array([ a0, a1, a2, a3, b1, b2, left_corner, right_corner ]);
}

function convolveMono16(src, out, line, coeff, width, height) {
  // takes src image and writes the blurred and transposed result into out

  var prev_src, curr_src, curr_out, prev_out, prev_prev_out;
  var src_index, out_index, line_index;
  var i, j;
  var coeff_a0, coeff_a1, coeff_b1, coeff_b2;

  for (i = 0; i < height; i++) {
    src_index = i * width;
    out_index = i;
    line_index = 0;

    // left to right
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[6];
    prev_out = prev_prev_out;

    coeff_a0 = coeff[0];
    coeff_a1 = coeff[1];
    coeff_b1 = coeff[4];
    coeff_b2 = coeff[5];

    for (j = 0; j < width; j++) {
      curr_src = src[src_index];

      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;
      prev_src = curr_src;

      line[line_index] = prev_out;
      line_index++;
      src_index++;
    }

    src_index--;
    line_index--;
    out_index += height * (width - 1);

    // right to left
    prev_src = src[src_index];
    prev_prev_out = prev_src * coeff[7];
    prev_out = prev_prev_out;
    curr_src = prev_src;

    coeff_a0 = coeff[2];
    coeff_a1 = coeff[3];

    for (j = width - 1; j >= 0; j--) {
      curr_out = curr_src * coeff_a0 +
                 prev_src * coeff_a1 +
                 prev_out * coeff_b1 +
                 prev_prev_out * coeff_b2;

      prev_prev_out = prev_out;
      prev_out = curr_out;

      prev_src = curr_src;
      curr_src = src[src_index];

      out[out_index] = line[line_index] + prev_out;

      src_index--;
      line_index--;
      out_index -= height;
    }
  }
}


function blurMono16(src, width, height, radius) {
  // Quick exit on zero radius
  if (!radius) { return; }

  var out      = new Uint16Array(src.length),
      tmp_line = new Float32Array(Math.max(width, height));

  var coeff = gaussCoef(radius);

  convolveMono16(src, out, tmp_line, coeff, width, height, radius);
  convolveMono16(out, src, tmp_line, coeff, height, width, radius);
}

module.exports = blurMono16;

},{}],7:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);
    
    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        if (cache[key].exports === fn) {
            wkey = key;
            break;
        }
    }
    
    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
    
    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'],'require(' + stringify(wkey) + ')(self)'),
        scache
    ];
    
    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;
    
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    
    return new Worker(URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}],"/":[function(require,module,exports){
'use strict';

/*global window, document*/
/*eslint space-infix-ops:0*/

// Feature detect
var WORKER = (typeof window !== 'undefined') && ('Worker' in window);
if (WORKER) {
  // IE don't allow to create webworkers from string. We should check it.
  // https://connect.microsoft.com/IE/feedback/details/801810/web-workers-from-blob-urls-in-ie-10-and-11
  try {
    var wkr = require('webworkify')(function () {});
    wkr.terminate();
  } catch (__) {
    WORKER = false;
  }
}

var WEBGL = false,
    __cvs;
try {
  if (typeof document !== 'undefined' &&
      typeof window !== 'undefined' &&
      window.WebGLRenderingContext) {

    __cvs = document.createElement('canvas');

    if (__cvs.getContext('webgl') || __cvs.getContext('experimental-webgl')) {
      WEBGL = true;
    }
  }
} catch (__) {
} finally {
  __cvs = null;
}

var resize       = require('./lib/resize');
var resizeWorker = require('./lib/resize_worker');
var resizeWebgl  = require('./lib/resize_webgl');


////////////////////////////////////////////////////////////////////////////////
// Helpers
function _class(obj) { return Object.prototype.toString.call(obj); }
function isFunction(obj) { return _class(obj) === '[object Function]'; }


////////////////////////////////////////////////////////////////////////////////
// API methods


// RGBA buffer async resize
//
function resizeBuffer(options, callback) {
  var wr;

  var _opts = {
    src:      options.src,
    dest:     null,
    width:    options.width|0,
    height:   options.height|0,
    toWidth:  options.toWidth|0,
    toHeight: options.toHeight|0,
    quality:  options.quality,
    alpha:    options.alpha,
    unsharpAmount:    options.unsharpAmount,
    unsharpRadius:    options.unsharpRadius,
    unsharpThreshold: options.unsharpThreshold
  };

  // Force flag reset to simplify status check
  if (!WORKER) { exports.WW = false; }

  if (WORKER && exports.WW) {
    exports.debug('Resize buffer in WebWorker');

    wr = require('webworkify')(resizeWorker);

    wr.onmessage = function(ev) {
      var i, l,
          dest = options.dest,
          output = ev.data.output;

      // If we got output buffer by reference, we should copy data,
      // because WW returns independent instance
      if (dest) {
        // IE ImageData can return old-style CanvasPixelArray
        // without .set() method. Copy manually for such case.
        if (dest.set) {
          dest.set(output);
        } else {
          for (i = 0, l = output.length; i < l; i++) {
            dest[i] = output[i];
          }
        }
      }
      callback(ev.data.err, output);
      wr.terminate();
    };

    if (options.transferable) {
      wr.postMessage(_opts, [ options.src.buffer ]);
    } else {
      wr.postMessage(_opts);
    }
    // Expose worker when available, to allow early termination.
    return wr;
  }

  // Fallback to sync call, if WebWorkers not available
  exports.debug('Resize buffer sync (freeze event loop)');

  _opts.dest = options.dest;
  resize(_opts, callback);
  return null;
}


// Canvas async resize
//
function resizeCanvas(from, to, options, callback) {
  var w = from.width,
      h = from.height,
      w2 = to.width,
      h2 = to.height;
  var ctxTo, imageDataTo;

  if (isFunction(options)) {
    callback = options;
    options = {};
  }

  if (!isNaN(options)) {
    options = { quality: options, alpha: false };
  }

  // Force flag reset to simplify status check
  if (!WEBGL) { exports.WEBGL = false; }

  if (WEBGL && exports.WEBGL) {
    exports.debug('Resize canvas with WebGL');

    return resizeWebgl(from, to, options, function (err) {
      if (err) {
        exports.debug('WebGL resize failed, do fallback and cancel next attempts');
        exports.debug(err);

        WEBGL = false;
        return resizeCanvas(from, to, options, callback);
      }
      callback();
    });

  }

  exports.debug('Resize canvas: prepare data');

  ctxTo = to.getContext('2d');
  imageDataTo = ctxTo.getImageData(0, 0, w2, h2);

  var _opts = {
    src:      from.getContext('2d').getImageData(0, 0, w, h).data,
    dest:     imageDataTo.data,
    width:    from.width,
    height:   from.height,
    toWidth:  to.width,
    toHeight: to.height,
    quality:  options.quality,
    alpha:    options.alpha,
    unsharpAmount:    options.unsharpAmount,
    unsharpRadius:    options.unsharpRadius,
    unsharpThreshold: options.unsharpThreshold,
    transferable: true
  };

  return resizeBuffer(_opts, function (err/*, output*/) {
    if (err) {
      callback(err);
      return;
    }

    ctxTo.putImageData(imageDataTo, 0, 0);
    callback();
  });
}


exports.resizeBuffer = resizeBuffer;
exports.resizeCanvas = resizeCanvas;
exports.WW = WORKER;
exports.WEBGL = false; // WEBGL;
exports.debug = function () {};

},{"./lib/resize":3,"./lib/resize_webgl":4,"./lib/resize_worker":5,"webworkify":7}]},{},[])("/")
});