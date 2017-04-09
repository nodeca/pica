// Collection of math functions
//
// 1. Combine components together
// 2. Has async init to load wasm modules
//
'use strict';


const base64decode     = require('./utils').base64decode;
const math_wasm_base64 = require('./mathlib/wasm/math_wasm_base64');


function MathLib(requested_features, preload) {
  this.__requested_features = requested_features || [];
  this.__initPromise = null;
  this.__wasm_module = preload && preload.wasm_module ? preload : null;

  // List of supported features, according to options & browser/node.js
  this.features = {
    js:   false, // pure JS implementation, can be disabled for testing
    wasm: false  // webassembly implementation for heavy functions
  };
}


MathLib.prototype.init = function init() {
  this.__initPromise = Promise.resolve().then(() => {
    // Map supported implementations
    this.unsharp = this.unsharp_js; // That's in JS only for a while

    if (this.__requested_features.indexOf('js') >= 0) {
      this.features.js = true;
      this.resize  = this.resize_js;
    }

    if ((typeof WebAssembly !== 'undefined') &&
        (this.__requested_features.indexOf('wasm') >= 0)) {

      if (this.__wasm_module) {
        this.features.wasm = true;
        this.resize  = this.resize_wasm;
        return null;
      }

      return WebAssembly.compile(base64decode(math_wasm_base64))
        .then(wasm_module => {
          this.__wasm_module = wasm_module;
          this.features.wasm = true;
          this.resize  = this.resize_wasm;
        })
        // Suppress init errors
        .catch(() => {});
    }

    return null;
  })
  .then(() => {
    if (!this.features.wasm && !this.features.js) {
      throw new Error('Pica mathlib: no supported methods found');
    }

    return this;
  });

  return this.__initPromise;
};


MathLib.prototype.resizeAndUnsharp = function resizeAndUnsharp(options, cache) {
  let result = this.resize(options, cache);

  if (options.unsharpAmount) {
    this.unsharp(
      result,
      options.toWidth,
      options.toHeight,
      options.unsharpAmount,
      options.unsharpRadius,
      options.unsharpThreshold
    );
  }

  return result;
};


// Pin implementations
MathLib.prototype.unsharp_js = require('./mathlib/unsharp_js');
MathLib.prototype.resize_js  = require('./mathlib/resize_js');


////////////////////////////////////////////////////////////////////////////////
// WebAssembly wrapper

const createFilters = require('./mathlib/resize_filter_gen');

function resetAlpha(dst, width, height) {
  let ptr = 3, len = (width * height * 4)|0;
  while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
}

function asUint8Array(src) {
  return new Uint8Array(src.buffer, 0, src.byteLength);
}

const IS_LE = ((new Uint32Array((new Uint8Array([ 1, 0, 0, 0 ])).buffer))[0] === 1);


function copyInt16asLE(src, target, target_offset) {
  if (IS_LE) {
    target.set(asUint8Array(src), target_offset);
    return;
  }

  for (let ptr = target_offset, i = 0; i < src.length; i++) {
    let data = src[i];
    target[ptr++] = data & 0xFF;
    target[ptr++] = (data >> 8) & 0xFF;
  }
}


MathLib.prototype.resize_wasm = function resize_wasm(options, cache) {
  const src     = options.src;
  const srcW    = options.width;
  const srcH    = options.height;
  const destW   = options.toWidth;
  const destH   = options.toHeight;
  const scaleX  = options.scaleX || options.toWidth / options.width;
  const scaleY  = options.scaleY || options.toHeight / options.height;
  const offsetX = options.offsetX || 0.0;
  const offsetY = options.offsetY || 0.0;
  const dest    = options.dest || new Uint8Array(destW * destH * 4);
  const quality = typeof options.quality === 'undefined' ? 3 : options.quality;
  const alpha   = options.alpha || false;

  if (!cache) cache = {};

  const fx_key = `filter_${quality}|${srcW}|${destW}|${scaleX}|${offsetX}`;
  const fy_key = `filter_${quality}|${srcH}|${destH}|${scaleY}|${offsetY}`;

  const filtersX = cache[fx_key] || createFilters(quality, srcW, destW, scaleX, offsetX),
        filtersY = cache[fy_key] || createFilters(quality, srcH, destH, scaleY, offsetY);

  //if (!cache[fx_key]) cache[fx_key] = filtersX;
  //if (!cache[fy_key]) cache[fy_key] = filtersY;

  const alloc_bytes = src.byteLength +
                    filtersX.byteLength +
                    filtersY.byteLength +
                    srcH * destW * 4; // Buffer between convolve passes

  const alloc_pages = Math.ceil(alloc_bytes / (64 * 1024));

  const wasm_imports = cache.wasm_imports || {
    env: {
      memoryBase: 0,
      tableBase:  0,
      memory: new WebAssembly.Memory({
        // Compiled wasm has 256 min memory value limit.
        // Atempt to provide less memory size will cause linking error
        initial: Math.max(256, alloc_pages)
      }),
      table: new WebAssembly.Table({
        initial:100,
        element: 'anyfunc'
      })
    }
  };

  // Increase memory size if needed
  const memory    = wasm_imports.env.memory,
        mem_pages = memory.buffer.byteLength / (64 * 1024);

  if (alloc_pages > mem_pages) {
    // increase to delta + 1MB
    memory.grow(alloc_pages - mem_pages + 16);
  }

  const wasm_instance = cache.wasm_instance || new WebAssembly.Instance(this.__wasm_module, wasm_imports);

  if (!cache.wasm_imports)  cache.wasm_imports  = wasm_imports;
  if (!cache.wasm_instance) cache.wasm_instance = wasm_instance;

  //
  // Fill memory block with data to process
  //

  const mem   = new Uint8Array(wasm_imports.env.memory.buffer);
  const mem32 = new Uint32Array(wasm_imports.env.memory.buffer);

  // mem.set(src)
  // 32-bit copy is much faster in chrome
  const src32 = new Uint32Array(src.buffer);
  mem32.set(src32);

  // Place tmp buffer after src to have 4x byte align.
  // That doesn't seems to make sence but costs nothing.
  const tmp_offset = src.byteLength;

  const filtersX_offset = tmp_offset + srcH * destW * 4;
  const filtersY_offset = filtersX_offset + filtersX.byteLength;

  // We should guarantee LE bytes order. Filters are not big, so
  // speed difference is not significant vs direct .set()
  copyInt16asLE(filtersX, mem, filtersX_offset);
  copyInt16asLE(filtersY, mem, filtersY_offset);

  //
  // Now call webassembly method
  //

  wasm_instance.exports._convolveHV(
    filtersX_offset,
    filtersY_offset,
    tmp_offset,
    srcW, srcH, destW, destH
  );

  //
  // Copy data back to typed array
  //

  // 32-bit copy is much faster in chrome
  const dest32 = new Uint32Array(dest.buffer);
  dest32.set(mem32.subarray(0, dest32.length));

  // That's faster than doing checks in convolver.
  // !!! Note, canvas data is not premultipled. We don't need other
  // alpha corrections.

  if (!alpha) resetAlpha(dest, destW, destH);

  return dest;
};


module.exports = MathLib;
