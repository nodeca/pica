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

var createCanvas  = require('./lib/util/create_canvas.js');

var ResizerJS     = require('./lib/resizer_js');
var ResizerJSWW   = require('./lib/resizer_js_ww');
var ResizerWebgl  = require('./lib/resizer_webgl');

////////////////////////////////////////////////////////////////////////////////
// Helpers
function _class(obj) { return Object.prototype.toString.call(obj); }
function isFunction(obj) { return _class(obj) === '[object Function]'; }

/////////////////////////////////////////////////////////////////////////////////
// Making tiles

var SRC_TILE_SIZE = 512;
var DEST_TILE_BORDER = 3;

function createRegions(fromWidth, fromHeight, toWidth, toHeight) {
  var scaleX = toWidth / fromWidth;
  var scaleY = toHeight / fromHeight;

  var innerTileWidth = Math.floor(SRC_TILE_SIZE * scaleX) - 2 * DEST_TILE_BORDER;
  var innerTileHeight = Math.floor(SRC_TILE_SIZE * scaleY) - 2 * DEST_TILE_BORDER;

  var x, y;
  var innerX, innerY, toTileWidth, toTileHeight;
  var tiles = [];
  var tile;

  // we go top-to-down instead of left-to-right to make image displayed from top to
  // doesn in the browser
  for (innerY = 0; innerY < toHeight; innerY += innerTileHeight) {
    for (innerX = 0; innerX < toWidth; innerX += innerTileWidth) {
      x = innerX - DEST_TILE_BORDER;
      if (x < 0) { x = 0; }
      toTileWidth = innerX + innerTileWidth + DEST_TILE_BORDER - x;
      if (x + toTileWidth >= toWidth) {
        toTileWidth = toWidth - x;
      }

      y = innerY - DEST_TILE_BORDER;
      if (y < 0) { y = 0; }
      toTileHeight = innerY + innerTileHeight + DEST_TILE_BORDER - y;
      if (y + toTileHeight >= toHeight) {
        toTileHeight = toHeight - y;
      }

      tile = {
        toX: x,
        toY: y,
        toWidth: toTileWidth,
        toHeight: toTileHeight,

        toInnerX: innerX,
        toInnerY: innerY,
        toInnerWidth: innerTileWidth,
        toInnerHeight: innerTileHeight,

        offsetX: x / scaleX - Math.floor(x / scaleX),
        offsetY: y / scaleY - Math.floor(y / scaleY),
        scaleX: scaleX,
        scaleY: scaleY,

        x: Math.floor(x / scaleX),
        y: Math.floor(y / scaleY),
        width: Math.ceil(toTileWidth / scaleX),
        height: Math.ceil(toTileHeight / scaleY)
      };

      tiles.push(tile);
    }
  }

  return tiles;
}

function eachLimit(list, limit, iterator, callback) {
  if (list.length === 0) {
    callback();
  }

  var current = 0;
  var failed = false;

  var next = function (err) {
    if (err) {
      if (!failed) {
        failed = true;
        callback(err);
      }
      return;
    }

    if (current < list.length) {
      iterator(list[current++], next);
    } else {
      callback();
    }
  };

  for (current = 0; current < limit && current < list.length; current++) {
    iterator(list[current], next);
  }
}

function resizeTiled (from, to, options, resizer, callback) {
  var regions = createRegions(from.width, from.height, to.width, to.height);
  var toCtx = to.getContext('2d');

  var canvasPool  = [];
  var i, tileData;

  for (i = 0; i < resizer.concurrency; i++) {
    tileData = {
      src: createCanvas(),
      dest: createCanvas()
    };
    tileData.src.width = SRC_TILE_SIZE;
    tileData.src.height = SRC_TILE_SIZE;
    tileData.dest.width = Math.floor(SRC_TILE_SIZE * to.width / from.width);
    tileData.dest.height = Math.floor(SRC_TILE_SIZE * to.height / from.height);

    canvasPool.push(tileData);
  }

  eachLimit(regions, resizer.concurrency, function (tile, next) {
    var canvases = canvasPool.pop();

    canvases.src.getContext('2d').drawImage(from,
      tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height);

    var _opts = {
      width:    tile.width,
      height:   tile.height,
      toWidth:  tile.toWidth,
      toHeight: tile.toHeight,
      scaleX:   tile.scaleX,
      scaleY:   tile.scaleY,
      offsetX:  tile.offsetX,
      offsetY:  tile.offsetY,
      quality:  options.quality,
      alpha:    options.alpha,
      unsharpAmount: options.unsharpAmount,
      unsharpRadius: options.unsharpRadius,
      unsharpThreshold: options.unsharpThreshold
    };

    resizer.resize(canvases.src, canvases.dest, _opts, function (err) {
      if (!err) {
        toCtx.drawImage(canvases.dest,
          tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
          tile.toInnerWidth, tile.toInnerHeight,
          tile.toInnerX, tile.toInnerY,
          tile.toInnerWidth, tile.toInnerHeight);
      }

      canvasPool.push(canvases);
      next(err);
    });
  }, function (err) {
    resizer.cleanup();
    callback(err);
  });
}

////////////////////////////////////////////////////////////////////////////////
// API methods

// Canvas async resize
//
function resizeCanvas(from, to, options, callback) {
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

    return resizeTiled(from, to, options, new ResizerWebgl(), function (err) {
      if (err) {
        exports.debug('WebGL resize failed, do fallback and cancel next attempts');
        exports.debug(err);

        WEBGL = false;
        resizeCanvas(from, to, options, callback);
      }
      callback();
    });
  }

  // Force flag reset to simplify status check
  if (!WORKER) { exports.WW = false; }

  if (WORKER && exports.WW) {
    exports.debug('Resize buffer in WebWorker');

    return resizeTiled(from, to, options, new ResizerJSWW(), callback);
  }

  // Fallback to sync call, if WebWorkers not available
  exports.debug('Resize buffer sync (freeze event loop)');

  return resizeTiled(from, to, options, new ResizerJS(), callback);
}


exports.resizeCanvas = resizeCanvas;
exports.WW = WORKER;
exports.WEBGL = false; // WEBGL;
exports.debug = function () {};
