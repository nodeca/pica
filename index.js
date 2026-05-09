'use strict';


const assign        = require('object-assign');
const webworkify    = require('webworkify');


const MathLib       = require('./lib/mathlib');
const Pool          = require('./lib/pool');
const utils         = require('./lib/utils');
const worker        = require('./lib/worker');
const createStages  = require('./lib/stepper');
const createRegions = require('./lib/tiler');
const filter_info        = require('./lib/mm_resize/resize_filter_info');
const supported_features = require('./lib/supported_features');


// Deduplicate pools & limiters with the same configs
// when user creates multiple pica instances.
const singletones = {};


let concurrency = 1;
if (typeof navigator !== 'undefined') {
  concurrency = Math.min(navigator.hardwareConcurrency || 1, 4);
}


const DEFAULT_PICA_OPTS = {
  tile: 1024,
  concurrency,
  features: [ 'js', 'wasm', 'ww' ],
  idle: 2000,
  createCanvas:  function (width, height) {
    let tmpCanvas = document.createElement('canvas');
    tmpCanvas.width  = width;
    tmpCanvas.height = height;
    return tmpCanvas;
  }
};


const DEFAULT_RESIZE_OPTS = {
  filter:           'mks2013',
  unsharpAmount:    0,
  unsharpRadius:    0.0,
  unsharpThreshold: 0
};

function workerFabric() {
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

  this.options = assign({}, DEFAULT_PICA_OPTS, options || {});

  let limiter_key = `lk_${this.options.concurrency}`;

  // Share limiters to avoid multiple parallel workers when user creates
  // multiple pica instances.
  this.__limit = singletones[limiter_key] || utils.limiter(this.options.concurrency);

  if (!singletones[limiter_key]) singletones[limiter_key] = this.__limit;

  // List of enabled resize methods, according to options & browser/node.js
  this.resize_features = {
    js:   false, // pure JS implementation, can be disabled for testing
    wasm: false, // webassembly implementation for heavy functions
    cib:  false, // resize via createImageBitmap (only FF at this moment)
    ww:   false  // webworkers
  };

  this.__workersPool = null;
  this.capabilities = {
    worker: false,
    ww_offscreen_canvas: false,
    canvas: false,
    offscreen_canvas: false,
    image_data: false,
    image_bitmap: false,
    may_be_worker: false,
    create_image_bitmap: false,
    safari_put_image_data_fix: false,
    bug_canvas_orientation_region: true,
    bug_image_bitmap_orientation_region: true,
    cib_resize: false
  };

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

  let checkCapabilities = supported_features.get_supported_features().then(result => {
    assign(this.capabilities, result);

    if (this.capabilities.cib_resize && features.indexOf('cib') >= 0) {
      this.resize_features.cib = true;
    }

    // Check WebWorker support if requested
    if (this.capabilities.may_be_worker && features.indexOf('ww') >= 0) {
      // pool uniqueness depends on pool config + webworker config
      let wpool_key = `wp_${JSON.stringify(this.options)}`;

      if (singletones[wpool_key]) {
        this.__workersPool = singletones[wpool_key];
      } else {
        this.__workersPool = new Pool(workerFabric, this.options.idle);
        singletones[wpool_key] = this.__workersPool;
      }
    }

    if (!this.__workersPool) return null;

    return this.__invokeWorker('get_supported_features').then(result => {
      if (!result || !result.data) return;

      this.capabilities.worker = true;
      this.resize_features.ww = true;
      this.capabilities.ww_offscreen_canvas = !!result.data.offscreen_canvas;
    }, () => {});
  });


  let initMath = this.__mathlib.init().then(mathlib => {
    // Copy detected resize methods
    assign(this.resize_features, mathlib.features);
  });

  // Init math lib. That's async because can load some
  this.__initPromise = Promise.all([
    initMath, checkCapabilities
  ]).then(() => this);

  return this.__initPromise;
};


Pica.prototype.__createCanvas = function (width, height, preferOffscreen) {
  if (preferOffscreen && this.capabilities.offscreen_canvas) {
    return new OffscreenCanvas(width, height);
  }

  if (this.capabilities.canvas) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (this.capabilities.ww_offscreen_canvas) {
    return new OffscreenCanvas(width, height);
  }

  return null;
};


// Call resizer in webworker or locally, depending on config
Pica.prototype.__invokeWorker = function (method, payload, transfer, opts) {
  return new Promise((resolve, reject) => {
    let w = this.__workersPool.acquire();

    if (opts && opts.cancelToken) opts.cancelToken.catch(err => reject(err));

    w.value.onmessage = ev => {
      w.release();

      if (ev.data.err) reject(ev.data.err);
      else resolve(ev.data);
    };

    w.value.postMessage(assign({ method: method }, payload || {}), transfer || []);
  });
};


Pica.prototype.__invokeResize = function (tileOpts, opts) {
  // Share cache between calls:
  //
  // - wasm instance
  // - wasm memory object
  //
  opts.__mathCache = opts.__mathCache || {};

  return Promise.resolve().then(() => {
    if (!this.resize_features.ww) {
      // not possible to have ImageBitmap here if user disabled WW
      return { data: this.__mathlib.resizeAndUnsharp(tileOpts, opts.__mathCache) };
    }

    return new Promise((resolve, reject) => {
      let w = this.__workersPool.acquire();

      if (opts.cancelToken) opts.cancelToken.catch(err => reject(err));

      w.value.onmessage = ev => {
        w.release();

        if (ev.data.err) reject(ev.data.err);
        else resolve(ev.data);
      };

      let transfer = [];

      if (tileOpts.src) transfer.push(tileOpts.src.buffer);
      if (tileOpts.srcBitmap) transfer.push(tileOpts.srcBitmap);

      w.value.postMessage({
        method: tileOpts.srcBitmap ? 'resize_bitmap' : 'resize',
        opts: tileOpts,
        features: this.__requested_features,
        preload: {
          wasm_nodule: this.__mathlib.__
        }
      }, transfer);
    });
  });
};


// this function can return promise if createImageBitmap is used
Pica.prototype.__extractTileData = function (tile, from, opts, stageEnv, extractTo) {
  if (this.resize_features.ww && this.capabilities.ww_offscreen_canvas) {
    this.debug('Create tile imageBitmap');

    let tileCanvas = this.__createCanvas(tile.width, tile.height, { preferOffscreen: true });
    let tileCtx = tileCanvas.getContext('2d');

    tileCtx.drawImage(stageEnv.srcImageBitmap || from,
      tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height);

    extractTo.srcBitmap = tileCanvas.transferToImageBitmap();
    return extractTo;

    // Direct region extraction, intentionally disabled. This can be faster,
    // but has known EXIF orientation bugs in some browsers.
    //
    // return createImageBitmap(stageEnv.srcImageBitmap || from, tile.x, tile.y, tile.width, tile.height)
    //   .then(bitmap => {
    //     extractTo.srcBitmap = bitmap;
    //     return extractTo;
    //   });
  }

  // Extract tile RGBA buffer, depending on input type
  if (utils.isCanvas(from)) {
    if (!stageEnv.srcCtx) stageEnv.srcCtx = from.getContext('2d');

    // If input is Canvas - extract region data directly
    this.debug('Get tile pixel data');
    extractTo.src = stageEnv.srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height).data;
    return extractTo;
  }

  // If input is Image or decoded to ImageBitmap,
  // draw region to temporary canvas and extract data from it
  //
  // Note! Attempt to reuse this canvas causes significant slowdown in chrome
  //
  this.debug('Draw tile imageBitmap/image to temporary canvas');

  let tmpCanvas = this.__createCanvas(tile.width, tile.height, { preferOffscreen: true });

  let tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.globalCompositeOperation = 'copy';
  tmpCtx.drawImage(stageEnv.srcImageBitmap || from,
    tile.x, tile.y, tile.width, tile.height,
    0, 0, tile.width, tile.height);

  this.debug('Get tile pixel data');

  extractTo.src = tmpCtx.getImageData(0, 0, tile.width, tile.height).data;

  // Safari 12 workaround
  // https://github.com/nodeca/pica/issues/199
  tmpCanvas.width = tmpCanvas.height = 0;

  return extractTo;
};


Pica.prototype.__landTileData = function (tile, result, stageEnv) {
  let toImageData;

  if (result.bitmap) {
    stageEnv.toCtx.drawImage(result.bitmap, tile.toX, tile.toY);
    result.bitmap.close();
    return null;
  }

  this.debug('Draw tile');

  toImageData = stageEnv.toCtx.createImageData(tile.toWidth, tile.toHeight);
  toImageData.data.set(result.data);

  if (this.capabilities.safari_put_image_data_fix) {
    // Safari draws thin white stripes between tiles without this fix
    stageEnv.toCtx.putImageData(toImageData, tile.toX, tile.toY,
      tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
      tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5);
  } else {
    stageEnv.toCtx.putImageData(toImageData, tile.toX, tile.toY,
      tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
      tile.toInnerWidth, tile.toInnerHeight);
  }

  return null;
};


Pica.prototype.__tileAndResize = function (from, to, opts) {
  let stageEnv = {
    srcCtx: null,
    srcImageBitmap: null,
    isImageBitmapReused: false,
    toCtx: null
  };

  const processTile = (tile => this.__limit(() => {
    if (opts.canceled) return opts.cancelToken;

    let tileOpts = {
      width:            tile.width,
      height:           tile.height,
      toWidth:          tile.toWidth,
      toHeight:         tile.toHeight,
      scaleX:           tile.scaleX,
      scaleY:           tile.scaleY,
      offsetX:          tile.offsetX,
      offsetY:          tile.offsetY,
      filter:           opts.filter,
      unsharpAmount:    opts.unsharpAmount,
      unsharpRadius:    opts.unsharpRadius,
      unsharpThreshold: opts.unsharpThreshold
    };

    this.debug('Invoke resize math');

    return Promise.resolve(tileOpts)
      .then(tileOpts => this.__extractTileData(tile, from, opts, stageEnv, tileOpts))
      .then(tileOpts => {
        this.debug('Invoke resize math');
        return this.__invokeResize(tileOpts, opts);
      })
      .then(result => {
        if (opts.canceled) return opts.cancelToken;
        stageEnv.srcImageData = null;
        return this.__landTileData(tile, result, stageEnv);
      });
  }));


  // Need to normalize data source first. It can be canvas or image.
  // If image - try to decode in background if possible
  return Promise.resolve().then(() => {
    stageEnv.toCtx = to.getContext('2d');

    if (utils.isCanvas(from)) return null;

    if (utils.isImageBitmap(from)) {
      stageEnv.srcImageBitmap = from;
      stageEnv.isImageBitmapReused = true;
      return null;
    }

    if (utils.isImage(from)) {
      // try do decode image in background for faster next operations;
      // if we're using offscreen canvas, cib is called per tile, so not needed here
      if (!this.capabilities.image_bitmap) return null;

      this.debug('Decode image via createImageBitmap');

      return createImageBitmap(from)
        .then(imageBitmap => {
          stageEnv.srcImageBitmap = imageBitmap;
        })
        // Suppress error to use fallback, if method fails
        // https://github.com/nodeca/pica/issues/190
        /* eslint-disable no-unused-vars */
        .catch(e => null);
    }

    throw new Error('Pica: ".from" should be Image, Canvas or ImageBitmap');
  })
  .then(() => {
    if (opts.canceled) return opts.cancelToken;

    this.debug('Calculate tiles');

    //
    // Here we are with "normalized" source,
    // follow to tiling
    //

    let regions = createRegions({
      width:          opts.width,
      height:         opts.height,
      srcTileSize:    this.options.tile,
      toWidth:        opts.toWidth,
      toHeight:       opts.toHeight,
      destTileBorder: opts.__destTileBorder
    });

    let jobs = regions.map(tile => processTile(tile));

    function cleanup(stageEnv) {
      if (stageEnv.srcImageBitmap) {
        if (!stageEnv.isImageBitmapReused) stageEnv.srcImageBitmap.close();
        stageEnv.srcImageBitmap = null;
      }
    }

    this.debug('Process tiles');

    return Promise.all(jobs).then(
      () => {
        this.debug('Finished!');
        cleanup(stageEnv); return to;
      },
      err => { cleanup(stageEnv); throw err; }
    );
  });
};


Pica.prototype.__processStages = function (stages, from, to, opts) {
  if (opts.canceled) return opts.cancelToken;

  let [ toWidth, toHeight ] = stages.shift();

  let isLastStage = (stages.length === 0);

  // Optimization for legacy filters -
  // only use user-defined quality for the last stage,
  // use simpler (Hamming) filter for the first stages where
  // scale factor is large enough (more than 2-3)
  //
  // For advanced filters (mks2013 and custom) - skip optimization,
  // because need to apply sharpening every time
  let filter;

  if (isLastStage || filter_info.q2f.indexOf(opts.filter) < 0) filter = opts.filter;
  else if (opts.filter === 'box') filter = 'box';
  else filter = 'hamming';

  opts = assign({}, opts, {
    toWidth,
    toHeight,
    filter
  });

  let tmpCanvas;

  if (!isLastStage) {
    // create temporary canvas
    tmpCanvas = this.__createCanvas(toWidth, toHeight, { preferOffscreen: true });
  }

  return this.__tileAndResize(from, (isLastStage ? to : tmpCanvas), opts)
    .then(() => {
      if (isLastStage) return to;

      opts.width = toWidth;
      opts.height = toHeight;
      return this.__processStages(stages, tmpCanvas, to, opts);
    })
    .then(res => {
      if (tmpCanvas) {
        // Safari 12 workaround
        // https://github.com/nodeca/pica/issues/199
        tmpCanvas.width = tmpCanvas.height = 0;
      }

      return res;
    });
};


Pica.prototype.__resizeViaCreateImageBitmap = function (from, to, opts) {
  let toCtx = to.getContext('2d');

  this.debug('Resize via createImageBitmap()');

  return createImageBitmap(from, {
    resizeWidth:   opts.toWidth,
    resizeHeight:  opts.toHeight,
    resizeQuality: utils.cib_quality_name(filter_info.f2q[opts.filter])
  })
  .then(imageBitmap => {
    if (opts.canceled) return opts.cancelToken;

    // if no unsharp - draw directly to output canvas
    if (!opts.unsharpAmount) {
      toCtx.drawImage(imageBitmap, 0, 0);
      imageBitmap.close();
      toCtx = null;

      this.debug('Finished!');

      return to;
    }

    this.debug('Unsharp result');

    let tmpCanvas = this.options.createCanvas(opts.toWidth, opts.toHeight);

    let tmpCtx = tmpCanvas.getContext('2d');

    tmpCtx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    let iData = tmpCtx.getImageData(0, 0, opts.toWidth, opts.toHeight);

    this.__mathlib.unsharp_mask(
      iData.data,
      opts.toWidth,
      opts.toHeight,
      opts.unsharpAmount,
      opts.unsharpRadius,
      opts.unsharpThreshold
    );

    toCtx.putImageData(iData, 0, 0);

    // Safari 12 workaround
    // https://github.com/nodeca/pica/issues/199
    tmpCanvas.width = tmpCanvas.height = 0;

    iData = tmpCtx = tmpCanvas = toCtx = null;

    this.debug('Finished!');

    return to;
  });
};


Pica.prototype.resize = function (from, to, options) {
  this.debug('Start resize...');


  let opts = assign({}, DEFAULT_RESIZE_OPTS);

  if (!isNaN(options)) {
    opts = assign(opts, { quality: options });
  } else if (options) {
    opts = assign(opts, options);
  }

  opts.toWidth  = to.width;
  opts.toHeight = to.height;
  opts.width    = from.naturalWidth || from.width;
  opts.height   = from.naturalHeight || from.height;

  // Legacy `.quality` option
  if (Object.prototype.hasOwnProperty.call(opts, 'quality')) {
    if (opts.quality < 0 || opts.quality > 3) {
      throw new Error(`Pica: .quality should be [0..3], got ${opts.quality}`);
    }
    opts.filter = filter_info.q2f[opts.quality];
  }

  // Prevent stepper from infinite loop
  if (to.width === 0 || to.height === 0) {
    return Promise.reject(new Error(`Invalid output size: ${to.width}x${to.height}`));
  }

  if (opts.unsharpRadius > 2) opts.unsharpRadius = 2;

  opts.canceled = false;

  if (opts.cancelToken) {
    // Wrap cancelToken to avoid successive resolve & set flag
    opts.cancelToken = opts.cancelToken.then(
      data => { opts.canceled = true; throw data; },
      err  => { opts.canceled = true; throw err; }
    );
  }

  let DEST_TILE_BORDER = 3; // Max possible filter window size
  opts.__destTileBorder = Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * opts.unsharpRadius|0));

  return this.init().then(() => {
    if (opts.canceled) return opts.cancelToken;

    // createImageBitmap doesn't work for images (Image, ImageBitmap) with
    // Exif orientation in Chrome. Enforce canvas use for such inputs.
    // see https://bugs.chromium.org/p/chromium/issues/detail?id=1220671
    if (this.capabilities.bug_image_bitmap_orientation_region &&
        (utils.isImage(from) || (utils.isImageBitmap(from)))) {
      const tmpCanvas = this.options.createCanvas(opts.width, opts.height);
      const tmpCtx = tmpCanvas.getContext('2d');
      tmpCtx.drawImage(from, 0, 0);
      from = tmpCanvas;
    }

    // if createImageBitmap supports resize, just do it and return
    if (this.resize_features.cib) {
      if (filter_info.q2f.indexOf(opts.filter) >= 0) {
        return this.__resizeViaCreateImageBitmap(from, to, opts);
      }

      this.debug('cib is enabled, but not supports provided filter, fallback to manual math');
    }

    if (!this.capabilities.canvas) {
      let err = new Error('Pica: cannot use getImageData on canvas, ' +
                          "make sure fingerprinting protection isn't enabled");
      err.code = 'ERR_GET_IMAGE_DATA';
      throw err;
    }

    //
    // No easy way, let's resize manually via arrays
    //

    let stages = createStages(
      opts.width,
      opts.height,
      opts.toWidth,
      opts.toHeight,
      this.options.tile,
      opts.__destTileBorder
    );

    return this.__processStages(stages, from, to, opts);
  });
};

// RGBA buffer resize
//
Pica.prototype.resizeBuffer = function (options) {
  const opts = assign({}, DEFAULT_RESIZE_OPTS, options);

  // Legacy `.quality` option
  if (Object.prototype.hasOwnProperty.call(opts, 'quality')) {
    if (opts.quality < 0 || opts.quality > 3) {
      throw new Error(`Pica: .quality should be [0..3], got ${opts.quality}`);
    }
    opts.filter = filter_info.q2f[opts.quality];
  }

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

    if (canvas.convertToBlob) {
      resolve(canvas.convertToBlob({
        type: mimeType,
        quality
      }));
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
