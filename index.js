'use strict';


const assign        = require('object-assign');
const webworkify    = require('webworkify');


const MathLib       = require('./lib/mathlib');
const Pool          = require('./lib/pool');
const utils         = require('./lib/utils');
const worker        = require('./lib/worker');
const createRegions = require('./lib/tiler');


let NEED_SAFARI_FIX = false;
try {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    NEED_SAFARI_FIX = navigator.userAgent.indexOf('Safari') >= 0;
  }
} catch (e) {}


let concurrency = 1;
if (typeof navigator !== 'undefined') {
  concurrency = Math.min(navigator.hardwareConcurrency || 1, 4);
}


const DEFAULT_PICA_OPTS = {
  tile: 1024,
  concurrency,
  features: [ 'all' ],
  idle: 2000
};


const DEFAULT_RESIZE_OPTS = {
  quality:          3,
  alpha:            false,
  unsharpAmount:    0,
  unsharpRadius:    0.0,
  unsharpThreshold: 0
};


function workerFablic() {
  return {
    value: webworkify(worker),
    destroy: function () {
      this.value.terminate();

      if (typeof window !== 'undefined') {
        let url = window.URL || window.webkitURL || window.mozURL || window.msURL;
        if (url && url.revokeObjectURL && this.value.objectURL) {
          url.revokeObjectURL(this.value.objectURL);
        }
      }
    }
  };
}


////////////////////////////////////////////////////////////////////////////////
// API methods

function Pica(options) {
  if (!(this instanceof Pica)) return new Pica(options);

  this.options = assign(DEFAULT_PICA_OPTS, options || {});

  this.__limit = utils.limiter(this.options.concurrency);

  // List of supported features, according to options & browser/node.js
  this.features = {
    js:   false, // pure JS implementation, can be disabled for testing
    wasm: false, // webassembly implementation for heavy functions
    cib:  false, // resize via createImageBitmap (only FF at this moment)
    ww:   false  // webworkers
  };

  this.__workersPool = null;

  // Store requested features for webworkers
  this.__requested_features = [];

  this.__mathlib = null;
}


Pica.prototype.init = function () {
  if (this.__initPromise) return this.__initPromise;

  let features = this.options.features.slice();

  if (features.indexOf('all') >= 0) {
    features = [ 'cib', 'wasm', 'js', 'ww' ];
  }

  this.__requested_features = features;

  this.__mathlib = new MathLib(features);

  // Check WebWorker support if requested
  if (features.indexOf('ww') >= 0) {
    if ((typeof window !== 'undefined') && ('Worker' in window)) {
      // IE <= 11 don't allow to create webworkers from string. We should check it.
      // https://connect.microsoft.com/IE/feedback/details/801810/web-workers-from-blob-urls-in-ie-10-and-11
      try {
        let wkr = require('webworkify')(function () {});
        wkr.terminate();
        this.features.ww   = true;
        this.__workersPool = new Pool(workerFablic, this.options.idle);
      } catch (__) {}
    }
  }

  let initMath = this.__mathlib.init().then(mathlib => {
    // Copy detected features
    assign(this.features, mathlib.features);
  });

  let checkCib = utils.cib_support().then(status => {
    this.features.cib = status;
  });

  // Init math lib. That's async because can load some
  this.__initPromise = Promise.all([ initMath, checkCib ]).then(() => this);

  return this.__initPromise;
};


Pica.prototype.resize = function (from, to, options) {
  let opts = DEFAULT_RESIZE_OPTS;

  if (!isNaN(options)) {
    opts = assign(opts, { quality: options });
  } else if (options) {
    opts = assign(opts, options);
  }

  opts.toWidth  = to.width;
  opts.toHeigth = to.height;
  opts.width    = from.naturalWidth || from.width;
  opts.height   = from.naturalHeight || from.height;

  let canceled    = false;
  let cancelToken = null;

  if (opts.cancelToken) {
    // Wrap cancelToken to avoid successive resolve & set flag
    cancelToken = opts.cancelToken.then(
      data => { canceled = true; throw data; },
      err  => { canceled = true; throw err; }
    );
  }

  let toCtx = to.getContext('2d', { alpha: Boolean(opts.alpha) });

  return this.init().then(() => {
    if (canceled) return cancelToken;

    // if createImageBitmap supports resize, just do it and return
    if (this.feature_cib) {
      return createImageBitmap(from, {
        resizeWidth:   opts.toWidth,
        resizeHeight:  opts.toHeigth,
        resizeQuality: utils.cib_quality_name(opts.quality)
      })
      .then(imageBitmap => {
        if (canceled) return cancelToken;

        // if no unsharp - draw directly to output canvas
        if (!opts.unsharpAmount) {
          toCtx.drawImage(imageBitmap, 0, 0);
          imageBitmap.close();
          toCtx = null;
          return to;
        }

        let tmpCanvas = document.createElement('canvas');

        tmpCanvas.width  = opts.toWidth;
        tmpCanvas.height = opts.toHeigth;

        let tmpCtx = tmpCanvas.getContext('2d', { alpha: Boolean(opts.alpha) });

        tmpCtx.drawImage(imageBitmap, 0, 0);
        imageBitmap.close();

        let iData = tmpCtx.getImageData(0, 0, opts.toWidth, opts.toHeigth);

        this.__mathlib.unsharp(
          iData.data,
          opts.toWidth,
          opts.toHeigth,
          opts.unsharpAmount,
          opts.unsharpRadius,
          opts.unsharpThreshold
        );

        toCtx.putImageData(iData, 0, 0);
        iData = tmpCtx = tmpCanvas = toCtx = null;
        return to;
      });
    }

    //
    // No easy way, let's resize manually via arrays
    //

    let srcCtx;
    let srcImageBitmap;

    // Share cache between calls:
    //
    // - wasm instance
    // - wasm memory object
    //
    let cache = {};

    // Call resizer in webworker or locally, depending on config
    const invokeResize = opts => {
      return Promise.resolve().then(() => {
        if (!this.features.ww) return this.__mathlib.resizeAndUnsharp(opts, cache);

        return new Promise((resolve, reject) => {
          let w = this.__workersPool.acquire();

          if (cancelToken) cancelToken.catch(err => reject(err));

          w.value.onmessage = ev => {
            w.release();

            if (ev.data.err) reject(ev.data.err);
            else resolve(ev.data.result);
          };

          w.value.postMessage({
            opts,
            features: this.__requested_features,
            preload: {
              wasm_nodule: this.__mathlib.__
            }
          }, [ opts.src.buffer ]);
        });
      });
    };


    const processTile = (tile => this.__limit(() => {
      if (canceled) return cancelToken;

      let srcImageData;

      // Extract tile RGBA buffer, depending on input type
      if (utils.isCanvas(from)) {
        // If input is Canvas - extract region data directly
        srcImageData = srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height);
      } else {
        // If input is Image or decoded to ImageBitmap,
        // draw region to temporary canvas and extract data from it
        //
        // Note! Attempt to reuse this canvas causes significant slowdown in chrome
        //
        let tmpCanvas = document.createElement('canvas');
        tmpCanvas.width  = tile.width;
        tmpCanvas.height = tile.height;

        let tmpCtx = tmpCanvas.getContext('2d', { alpha: Boolean(opts.alpha) });
        tmpCtx.globalCompositeOperation = 'copy';
        tmpCtx.drawImage(srcImageBitmap || from,
          tile.x, tile.y, tile.width, tile.height,
          0, 0, tile.width, tile.height);

        srcImageData = tmpCtx.getImageData(0, 0, tile.width, tile.height);
        tmpCtx = tmpCanvas = null;
      }

      let o = {
        src:              srcImageData.data,
        width:            tile.width,
        height:           tile.height,
        toWidth:          tile.toWidth,
        toHeight:         tile.toHeight,
        scaleX:           tile.scaleX,
        scaleY:           tile.scaleY,
        offsetX:          tile.offsetX,
        offsetY:          tile.offsetY,
        quality:          opts.quality,
        alpha:            opts.alpha,
        unsharpAmount:    opts.unsharpAmount,
        unsharpRadius:    opts.unsharpRadius,
        unsharpThreshold: opts.unsharpThreshold
      };

      return Promise.resolve()
        .then(() => invokeResize(o))
        .then(result => {
          if (canceled) return cancelToken;

          srcImageData = null;

          let toImageData;

          if (typeof ImageData !== 'undefined') {
            // this branch is for browsers
            toImageData = new ImageData(new Uint8ClampedArray(result), tile.toWidth, tile.toHeight);
          } else {
            // fallback for node-canvas
            toImageData = toCtx.createImageData(tile.toWidth, tile.toHeight);
            toImageData.data.set(result);
          }

          if (NEED_SAFARI_FIX) {
            // Safari draws thin white stripes between tiles without this fix
            toCtx.putImageData(toImageData, tile.toX, tile.toY,
              tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
              tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5);
          } else {
            toCtx.putImageData(toImageData, tile.toX, tile.toY,
              tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
              tile.toInnerWidth, tile.toInnerHeight);
          }

          return null;
        });
    }));


    // Need normalize data source first. It can be canvas or image.
    // If image - try to decode in background if possible
    return Promise.resolve().then(() => {
      if (utils.isCanvas(from)) {
        srcCtx = from.getContext('2d', { alpha: Boolean(opts.alpha) });
        return null;
      }

      if (utils.isImage(from)) {
        // try do decode image in background for faster next operations
        if (typeof createImageBitmap === 'undefined') return null;

        return createImageBitmap(from)
          .then(imageBitmap => {
            srcImageBitmap = imageBitmap;
          });
      }

      throw new Error('".from" should be image or canvas');
    })
    .then(() => {
      if (canceled) return cancelToken;

      //
      // Here we are with "normalized" source,
      // follow to tiling
      //

      let DEST_TILE_BORDER = 3; // Max possible filter window size

      let regions = createRegions({
        width:        opts.width,
        height:       opts.height,
        srcTileSize:  this.options.tile,
        toWidth:      opts.toWidth,
        toHeight:     opts.toHeigth,
        destTileBorder: Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * opts.unsharpRadius|0))
      });

      let jobs = regions.map(tile => processTile(tile));

      function cleanup() {
        if (srcImageBitmap) {
          srcImageBitmap.close();
          srcImageBitmap = null;
        }
      }

      return Promise.all(jobs).then(
        () =>  { cleanup(); return to; },
        err => { cleanup(); throw err; }
      );
    });
  });
};

// RGBA buffer resize
//
Pica.prototype.resizeBuffer = function (options) {
  const opts = assign(DEFAULT_RESIZE_OPTS, options);

  return this.init()
    .then(() => this.__mathlib.resizeAndUnsharp(opts));
};


Pica.prototype.toBlob = function (canvas, mimeType, quality) {
  mimeType = mimeType || 'image/png';

  return new Promise(resolve => {
    if (canvas.toBlob) {
      canvas.toBlob(blob => resolve(blob), mimeType, quality);
      return;
    }

    // Fallback for old browsers
    const asString = atob(canvas.toDataURL(mimeType, quality).split(',')[1]);
    const len      = asString.length;
    const asBuffer = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      asBuffer[i] = asString.charCodeAt(i);
    }

    resolve(new Blob([ asBuffer ], { type: mimeType }));
  });
};


Pica.prototype.debug = function () {};


module.exports = Pica;
