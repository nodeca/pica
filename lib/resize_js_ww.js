/* global navigator */
/*eslint space-infix-ops:0*/

'use strict';


var webworkify    = require('webworkify');
var resizeWorker  = require('./js/worker.js');
var createRegions = require('./js/utils').createRegions;
var eachLimit     = require('./js/utils').eachLimit;
var generateId    = require('./js/generate_id');
var createCanvas  = require('./js/create_canvas');
var Pool          = require('./js/pool');

var SRC_TILE_SIZE = 1024;
var DEST_TILE_BORDER = 3;

var workersPool = new Pool(function () {
  return {
    value: webworkify(resizeWorker),
    destroy: function () {
      this.value.terminate();
    }
  };
});

var running = {};
var iscleanUp = false;

function resize_js_ww(from, to, options, callback) {
  var toCtx = to.getContext('2d', { alpha: Boolean(options.alpha) });
  /* We use intermediate canvases because without it Firefox resizes 8x times slower
   * than with it. It makes resize 20% slower in Chrome */
  var fromTile = createCanvas();

  fromTile.width = Math.min(SRC_TILE_SIZE, from.naturalWidth || from.width);
  fromTile.height = Math.min(SRC_TILE_SIZE, from.naturalHeight || from.height);

  var fromTileCtx = fromTile.getContext('2d', { alpha: Boolean(options.alpha) });

  // Should not use previous content of reused canvas when alpha exists.
  fromTileCtx.globalCompositeOperation = 'copy';

  var regions = createRegions({
    width: from.naturalWidth || from.width,
    height: from.naturalHeight || from.height,
    srcTileSize: SRC_TILE_SIZE,
    toWidth: to.width,
    toHeight: to.height,
    destTileBorder: Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * options.unsharpRadius|0))
  });

  var concurrency = navigator && navigator.hardwareConcurrency || 4;
  var id = options._id || generateId();

  running[id] = true;
  eachLimit(regions, concurrency, function (tile, next) {
    fromTileCtx.drawImage(from, tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height);

    var fromImageData = fromTileCtx.getImageData(0, 0, tile.width, tile.height);

    var _opts = {
      src:      fromImageData.data,
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
      unsharpAmount:    options.unsharpAmount,
      unsharpRadius:    options.unsharpRadius,
      unsharpThreshold: options.unsharpThreshold
    };

    var worker = workersPool.acquire();

    worker.value.onmessage = function (ev) {
      var i, l;
      var imageDataTo, output, dest;

      worker.release();
       //release from memory objecturl used to create url
      window.URL.revokeObjectURL(worker.value.objectURL);

      if (!running[id]) {
        next(true);
        return;
      }
      if (ev.data.err) {
        next(ev.data.err);
        return;
      }

      imageDataTo = toCtx.createImageData(tile.toWidth, tile.toHeight);
      output = ev.data.output;
      dest = imageDataTo.data;

      if (dest.set) {
        dest.set(output);
      } else {
        for (i = 0, l = output.length; i < l; i++) {
          dest[i] = output[i];
        }
      }

      toCtx.putImageData(imageDataTo, tile.toX, tile.toY,
        tile.toInnerX - tile.toX, tile.toInnerY - tile.toY,
        tile.toInnerWidth, tile.toInnerHeight);
      next();
    };

    worker.value.postMessage(_opts, [ _opts.src.buffer ]);
  }, function (err) {
    if (running[id]) {
      delete running[id];
      callback(err);
    }
  });

  return id;
}

function terminate(id) {
  if (running[id]) {
    delete running[id];
  }
}

module.exports = resize_js_ww;
module.exports.terminate = terminate;
