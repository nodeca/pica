'use strict';


const createFilters        = require('./resize_filter_gen');
const convolveHorizontally = require('./convolve').convolveHorizontally;
const convolveVertically   = require('./convolve').convolveVertically;


function resetAlpha(dst, width, height) {
  let ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


module.exports = function resize(options) {
  const src   = options.src;
  const srcW  = options.width;
  const srcH  = options.height;
  const destW = options.toWidth;
  const destH = options.toHeight;
  const scaleX = options.scaleX || options.toWidth / options.width;
  const scaleY = options.scaleY || options.toHeight / options.height;
  const offsetX = options.offsetX || 0;
  const offsetY = options.offsetY || 0;
  const dest  = options.dest || new Uint8Array(destW * destH * 4);
  const quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  const alpha = options.alpha || false;

  const filtersX = createFilters(quality, srcW, destW, scaleX, offsetX),
        filtersY = createFilters(quality, srcH, destH, scaleY, offsetY);

  const tmp  = new Uint8Array(destW * srcH * 4);

  // To use single function we need src & tmp of the same type.
  // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
  // vertical and horizontal passes separately to avoid deoptimization.

  convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
  convolveVertically(tmp, dest, srcH, destW, destH, filtersY);

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) resetAlpha(dest, destW, destH);

  return dest;
};
