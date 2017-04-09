'use strict';


const createFilters        = require('./resize_filter_gen');
const convolveHorizontally = require('./resize_convolve_js').convolveHorizontally;
const convolveVertically   = require('./resize_convolve_js').convolveVertically;


function resetAlpha(dst, width, height) {
  let ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}


function resize(options, cache) {
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

  if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) { return []; }

  if (!cache) cache = {};

  const fx_key = `filter_${quality}|${srcW}|${destW}|${scaleX}|${offsetX}`;
  const fy_key = `filter_${quality}|${srcH}|${destH}|${scaleY}|${offsetY}`;

  const filtersX = cache[fx_key] || createFilters(quality, srcW, destW, scaleX, offsetX),
        filtersY = cache[fy_key] || createFilters(quality, srcH, destH, scaleY, offsetY);

  //if (!cache[fx_key]) cache[fx_key] = filtersX;
  //if (!cache[fy_key]) cache[fy_key] = filtersY;

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
}


module.exports = resize;
